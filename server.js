require('dotenv').config();

const express = require('express');
const path = require('path');
const nodemailer = require('nodemailer');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: '10mb' }));
app.use(express.static(path.join(__dirname, 'public')));

// Escapa HTML para evitar que o nome do jogador quebre o e-mail
function escapeHtml(value) {
    return String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

// Cria o transporter de e-mail
async function createTransporter() {
    // ==========================================
    // SMTP REAL
    // ==========================================
    if (
        process.env.SMTP_HOST &&
        process.env.SMTP_USER &&
        process.env.SMTP_PASS
    ) {
        const port = Number(process.env.SMTP_PORT || 587);

        console.log(`📧 Usando SMTP: ${process.env.SMTP_HOST}:${port}`);

        return nodemailer.createTransport({
            host: process.env.SMTP_HOST,
            port: 587,
            secure: false,

            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS
            },

            requireTLS: true,

            tls: {
                minVersion: "TLSv1.2",
                servername: "smtp.gmail.com"
            },

            connectionTimeout: 30000,
            greetingTimeout: 30000,
            socketTimeout: 30000
        });

    }

    // ==========================================
    // ETHEREAL - TESTE
    // ==========================================

    console.log('📬 Nenhum SMTP configurado. Criando conta Ethereal...');

    const testAccount = await nodemailer.createTestAccount();

    console.log(
        `📬 Ethereal usuário: ${testAccount.user}`
    );

    const transporter = nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false,

        auth: {
            user: testAccount.user,
            pass: testAccount.pass
        },

        requireTLS: true,

        tls: {
            rejectUnauthorized: false,
            servername: 'smtp.ethereal.email'
        },

        connectionTimeout: 30000,
        greetingTimeout: 30000,
        socketTimeout: 30000
    });

    return transporter;
}

async function sendCertificateEmail(mailOptions) {
    const transporter = await createTransporter();

    // Verifica a conexão
    await transporter.verify();

    console.log('✅ Conexão SMTP estabelecida.');

    const info = await transporter.sendMail(mailOptions);

    console.log('📨 E-mail enviado:', info.messageId);

    const previewUrl = nodemailer.getTestMessageUrl(info);

    if (previewUrl) {
        console.log('🔗 Preview Ethereal:', previewUrl);
    }

    return {
        info,
        previewUrl: previewUrl || null
    };
}

app.post('/api/send-certificate', async (req, res) => {
    try {
        const {
            email,
            playerName,
            score,
            highScore,
            skinName,
        } = req.body;

        // Validações
        if (!email || !playerName) {
            return res.status(400).json({
                error: 'E-mail e Nome do Jogador são obrigatórios.',
            });
        }

        const emailRegex =
            /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (!emailRegex.test(email)) {
            return res.status(400).json({
                error: 'Digite um e-mail válido.',
            });
        }

        const safePlayerName = escapeHtml(playerName);
        const safeSkinName = escapeHtml(
            skinName || 'Flappy Clássico'
        );

        const numericScore = Number(score) || 0;
        const numericHighScore = Number(highScore) || 0;

        let medal = '🥉 Bronze';

        if (numericScore >= 40) {
            medal = '💎 Platina';
        } else if (numericScore >= 25) {
            medal = '🥇 Ouro';
        } else if (numericScore >= 10) {
            medal = '🥈 Prata';
        }

        const dateStr = new Date().toLocaleDateString('pt-BR');

        const htmlTemplate = `
      <!DOCTYPE html>
      <html lang="pt-BR">
      <head>
        <meta charset="UTF-8">
        <title>Certificado Flappy Arcade</title>
      </head>

      <body style="
        margin: 0;
        padding: 0;
        background-color: #70c5ce;
        font-family: Arial, Helvetica, sans-serif;
      ">

        <div style="
          padding: 30px 15px;
        ">

          <div style="
            max-width: 600px;
            margin: 0 auto;
            background: #ffffff;
            border: 8px solid #ded895;
            border-radius: 12px;
            padding: 30px;
            text-align: center;
          ">

            <h1 style="
              color: #e06010;
              margin-top: 0;
            ">
              🏆 CERTIFICADO FLAPPY ARCADE
            </h1>

            <hr style="
              border: 0;
              border-top: 2px solid #70c5ce;
              margin: 20px 0;
            ">

            <p style="font-size: 18px;">
              Certificamos que
            </p>

            <p style="
              font-size: 24px;
              font-weight: bold;
              color: #e06010;
            ">
              ${safePlayerName}
            </p>

            <p>
              alcançou
              <strong>${numericScore} pontos</strong>
            </p>

            <p>
              usando a skin
              <em>"${safeSkinName}"</em>.
            </p>

            <div style="
              background: #ded895;
              border-radius: 8px;
              padding: 15px;
              margin: 20px 0;
            ">

              <p style="margin: 5px 0;">
                <strong>Recorde Pessoal:</strong>
                ${numericHighScore}
              </p>

              <p style="
                margin: 5px 0;
                font-size: 20px;
              ">
                <strong>Medalha:</strong>
                ${medal}
              </p>

            </div>

            <p style="
              font-size: 12px;
              color: #999;
              margin-top: 25px;
            ">
              Emitido em: ${dateStr}
            </p>

            <p style="
              font-size: 11px;
              color: #aaa;
            ">
              Autenticado por Flappy Arcade Server
            </p>

          </div>

        </div>

      </body>
      </html>
    `;

        const result = await sendCertificateEmail({
            from:
                process.env.SMTP_FROM ||
                '"Flappy Arcade Certificadora" <no-reply@flappyarcade.com>',

            to: email,

            subject:
                `🏆 Seu Certificado Flappy Arcade - ` +
                `${playerName} (${numericScore} pts)`,

            html: htmlTemplate,
        });

        return res.json({
            success: true,
            message: 'Certificado enviado com sucesso!',
            previewUrl: result.previewUrl,
        });

    } catch (err) {
        console.error('❌ Erro ao enviar e-mail:');
        console.error(err);

        return res.status(500).json({
            success: false,
            error:
                'Não foi possível enviar o e-mail. ' +
                'Verifique as configurações SMTP do servidor.',
        });
    }
});

app.listen(PORT, () => {
    console.log(
        `🎮 Servidor rodando em http://localhost:${PORT}`
    );
});