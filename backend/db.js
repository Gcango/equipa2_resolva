
 // Carrega as variáveis do ficheiro .env
require('dotenv').config();

// Biblioteca para comunicar com MariaDB/MySQL
const mysql = require('mysql2/promise');

// Cria uma pool de ligações à base de dados
const pool = mysql.createPool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,

    // Ativa SSL quando DB_SSL=true
    ...(process.env.DB_SSL === 'true'
        ? {
            ssl: {
                minVersion: 'TLSv1.2',
                rejectUnauthorized: true
            }
        }
        : {}),

    // Mantém as datas como texto
    dateStrings: true
});

// Testar a ligação
async function testarLigacao() {
    try {
        const connection = await pool.getConnection();

        console.log('Ligação à base de dados RESOLVA efetuada com sucesso!');

        connection.release();
    } catch (erro) {
        console.error('Erro ao ligar à base de dados:');
        console.error(erro.message);
    }
}

testarLigacao();

module.exports = pool;
