const express = require('express');
const fs = require('fs');
const path = require('path');
const bodyParser = require('body-parser');
const cors = require('cors');
const nodemailer = require('nodemailer');

const app = express();
app.use(cors());
app.use(bodyParser.json());

const mailAccounts = [
    {user: 'target@support-internationallegalcollege.com', pass: 'G1I5xXLmDy'},
    {user: 'support@support-internationallegalcollege.com', pass: 'aynF2l2y4J'},
    {user: 'info@support-internationallegalcollege.com', pass: 'oxhZtDDSPj'},
    {user: 'promo@support-internationallegalcollege.com', pass: 'gCI8hCXnyy'},
    {user: 'promotion@support-internationallegalcollege.com', pass: 'V0by9f3eds'},
];

const templates = ['template2.html', 'template3.html'];

let currentMailIndex = 0;
let currentTemplateIndex = 0;

const emailsPath = path.join(__dirname, 'emails', 'emails.csv');
const sentEmailsPath = path.join(__dirname, 'emails', 'send.csv');

function readCSV(filePath) {
    try {
        const data = fs.readFileSync(filePath, 'utf8');
        return data.split('\n').filter((line) => line.trim() !== '').slice(1); // Пропуск заголовка
    } catch (err) {
        console.error(`Error reading ${filePath}:`, err);
        return [];
    }
}

function appendToCSV(filePath, content) {
    try {
        fs.appendFileSync(filePath, `${content}\n`);
    } catch (err) {
        console.error(`Error writing to ${filePath}:`, err);
    }
}

function writeCSV(filePath, lines) {
    try {
        const header = 'email\n';
        fs.writeFileSync(filePath, header + lines.join('\n'));
    } catch (err) {
        console.error(`Error overwriting ${filePath}:`, err);
    }
}

function getTransporter() {
    const mailConfig = mailAccounts[currentMailIndex];
    return nodemailer.createTransport({
        host: 'smtp.gmail.com',
        port: 465,
        secure: true,
        auth: {
            user: mailConfig.user,
            pass: mailConfig.pass,
        },
        tls: {
            rejectUnauthorized: false,
        },
    });
}

function sendEmails() {
    const emails = readCSV(emailsPath);
    if (emails.length === 0) {
        console.log('No emails left to process.');
        return;
    }

    const emailToSend = emails[0];
    const templateToUse = templates[currentTemplateIndex];
    const transporter = getTransporter();

    const templatePath = path.join(__dirname, 'templates', templateToUse);

    fs.readFile(templatePath, 'utf8', (err, data) => {
        if (err) {
            console.error('Error reading template file:', err);
            return;
        }

        const renderedTemplate = data.replace('{{email}}', emailToSend);

        const mailOptions = {
            from: mailAccounts[currentMailIndex].user,
            to: emailToSend,
            subject: "Здравствуйте, уважаемый клиент International Legal College",
            text: "Вы получили данное письмо, так как вы являетесь клиентом International Legal College и ваши денежные средства были найдены в криптовалюте.",
            html: renderedTemplate,
        };

        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                console.error('Error sending email:', error);
                return;
            }

            console.log(`Email sent to ${emailToSend} using template ${templateToUse}`);
            const remainingEmails = emails.slice(1);
            writeCSV(emailsPath, remainingEmails);

            appendToCSV(sentEmailsPath, emailToSend);

            currentMailIndex = (currentMailIndex + 1) % mailAccounts.length;
            currentTemplateIndex = (currentTemplateIndex + 1) % templates.length;

            const delay = Math.random() * (15000 - 10000) + 10000;
            setTimeout(sendEmails, delay);
        });
    });
}

app.post('/start', (req, res) => {
    sendEmails();
    res.send('Email sending process started');
});

app.get('/view-emails', (req, res) => {
    const filePath = path.join(__dirname, 'emails', 'emails.csv');
    fs.readFile(filePath, 'utf8', (err, data) => {
        if (err) {
            console.error('Error reading file:', err);
            return res.status(500).send('Unable to read the file.');
        }
        res.type('text/plain').send(data);
    });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});