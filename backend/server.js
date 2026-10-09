const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const db = require('./db');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// ======================================================
// CONFIGURAÇÃO DAS FOTOGRAFIAS DOS PEDIDOS
// ======================================================

// Criar a pasta onde ficam guardadas as imagens
const pastaImagens = path.join(__dirname, 'uploads', 'pedidos');

if (!fs.existsSync(pastaImagens)) {
    fs.mkdirSync(pastaImagens, { recursive: true });
}

// Definir onde e com que nome guardar cada imagem
const armazenamento = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, pastaImagens);
    },

    filename: (req, file, cb) => {
        const nomeUnico =
            Date.now() + '-' +
            Math.round(Math.random() * 1e9);

        cb(null, nomeUnico + path.extname(file.originalname).toLowerCase());
    }
});

// Aceitar apenas imagens e limitar a 5 MB
const uploadImagem = multer({
    storage: armazenamento,

    limits: {
        fileSize: 5 * 1024 * 1024
    },

    fileFilter: (req, file, cb) => {
        const tiposPermitidos = [
            'image/jpeg',
            'image/png',
            'image/webp'
        ];

        if (tiposPermitidos.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Apenas imagens JPG, PNG ou WEBP.'));
        }
    }
});

// Permitir consultar as imagens através do backend
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ======================================================
// TESTE DA API
// ======================================================

app.get('/', (req, res) => {
    res.json({
        mensagem: 'API RESOLVA está a funcionar!'
    });
});


// ======================================================
// AUTENTICAÇÃO
// ======================================================


// ======================================================
// POST - LOGIN
// ======================================================
app.post('/api/login', async (req, res) => {
    try {
        const email = req.body.email?.trim().toLowerCase();
        const password = req.body.password;

        // ==================================================
        // 1. VALIDAR CAMPOS
        // ==================================================

        if (!email || !password) {
            return res.status(400).json({
                erro: 'Email e password são obrigatórios.'
            });
        }

        // ==================================================
        // 2. PROCURAR UTILIZADOR PELO EMAIL
        // ==================================================

        const [utilizadores] = await db.query(`
            SELECT
                id,
                nome,
                email,
                telefone,
                password_hash,
                role
            FROM utilizadores
            WHERE email = ?
            LIMIT 1
        `, [email]);

        if (utilizadores.length === 0) {
            return res.status(401).json({
                erro: 'Email ou password incorretos.'
            });
        }

        const utilizador = utilizadores[0];

        // ==================================================
        // 3. VERIFICAR PASSWORD COM BCRYPT
        // ==================================================

        const passwordGuardada = utilizador.password_hash || '';

        // Apenas aceitar palavras-passe protegidas com bcrypt
        const usaBcrypt =
            passwordGuardada.startsWith('$2a$') ||
            passwordGuardada.startsWith('$2b$') ||
            passwordGuardada.startsWith('$2y$');

        let passwordCorreta = false;

        if (usaBcrypt) {
            passwordCorreta = await bcrypt.compare(
                password,
                passwordGuardada
            );
        }

        // ==================================================
        // 4. PASSWORD INCORRETA
        // ==================================================

        if (!passwordCorreta) {
            return res.status(401).json({
                erro: 'Email ou password incorretos.'
            });
        }

        // ==================================================
        // 5. LOGIN CORRETO
        // ==================================================

        res.json({
            mensagem: 'Login efetuado com sucesso.',

            utilizador: {
                id: utilizador.id,
                nome: utilizador.nome,
                email: utilizador.email,
                telefone: utilizador.telefone,
                role: utilizador.role
            }
        });

    } catch (erro) {

        console.error(
            'Erro ao efetuar login:',
            erro
        );

        res.status(500).json({
            erro: 'Erro ao efetuar login.'
        });
    }
});


// ======================================================
// POST - REGISTAR NOVO UTILIZADOR
// ======================================================
app.post('/api/register', async (req, res) => {
    let connection;

    try {

        // ==================================================
        // 1. RECEBER DADOS
        // ==================================================

        const nome =
            req.body.nome?.trim();

        const email =
            req.body.email?.trim().toLowerCase();

        const password =
            req.body.password;

        const telefone =
            req.body.telefone?.trim() || null;

        const roleRecebido =
            req.body.role;

        const especialidades =
            req.body.especialidades || [];


        // ==================================================
        // 2. VALIDAR CAMPOS OBRIGATÓRIOS
        // ==================================================

        if (!nome || !email || !password) {
            return res.status(400).json({
                erro: 'Nome, email e password são obrigatórios.'
            });
        }


        // ==================================================
        // 3. VALIDAR PASSWORD
        // ==================================================

        if (password.length < 6) {
            return res.status(400).json({
                erro: 'A password deve ter pelo menos 6 caracteres.'
            });
        }


        // ==================================================
        // 4. DEFINIR ROLE
        // ==================================================

        const role =
            roleRecebido === 'tecnico'
                ? 'tecnico'
                : 'cliente';


        // ==================================================
        // 5. VALIDAR ESPECIALIDADES
        // ==================================================

        if (
            role === 'tecnico' &&
            !Array.isArray(especialidades)
        ) {
            return res.status(400).json({
                erro: 'As especialidades devem ser enviadas numa lista.'
            });
        }


        const idsEspecialidades =
            role === 'tecnico'
                ? especialidades
                    .map(id => Number(id))
                    .filter(
                        id =>
                            Number.isInteger(id) &&
                            id > 0
                    )
                : [];


        // Se algum ID recebido for inválido
        if (
            role === 'tecnico' &&
            idsEspecialidades.length !== especialidades.length
        ) {
            return res.status(400).json({
                erro: 'Existe uma especialidade inválida.'
            });
        }


        // Remover IDs repetidos
        const idsUnicos =
            [...new Set(idsEspecialidades)];


        // ==================================================
        // 6. ABRIR LIGAÇÃO E TRANSAÇÃO
        // ==================================================

        connection =
            await db.getConnection();

        await connection.beginTransaction();


        // ==================================================
        // 7. VERIFICAR SE EMAIL JÁ EXISTE
        // ==================================================

        const [utilizadoresExistentes] =
            await connection.query(`
                SELECT id
                FROM utilizadores
                WHERE email = ?
                LIMIT 1
            `, [
                email
            ]);


        if (utilizadoresExistentes.length > 0) {

            await connection.rollback();

            return res.status(409).json({
                erro: 'Já existe uma conta com este email.'
            });
        }


        // ==================================================
        // 8. VALIDAR CATEGORIAS DO TÉCNICO
        // ==================================================

        if (
            role === 'tecnico' &&
            idsUnicos.length > 0
        ) {

            const placeholders =
                idsUnicos
                    .map(() => '?')
                    .join(',');


            const [categoriasExistentes] =
                await connection.query(`
                    SELECT id
                    FROM categorias
                    WHERE id IN (${placeholders})
                `, idsUnicos);


            if (
                categoriasExistentes.length !==
                idsUnicos.length
            ) {

                await connection.rollback();

                return res.status(400).json({
                    erro:
                        'Uma ou mais especialidades não existem.'
                });
            }
        }


        // ==================================================
        // 9. CRIAR HASH DA PASSWORD
        // ==================================================

        const passwordHash =
            await bcrypt.hash(
                password,
                10
            );


        // ==================================================
        // 10. CRIAR UTILIZADOR
        // ==================================================

        const [resultadoUtilizador] =
            await connection.query(`
                INSERT INTO utilizadores (
                    nome,
                    email,
                    telefone,
                    password_hash,
                    role
                )
                VALUES (?, ?, ?, ?, ?)
            `, [
                nome,
                email,
                telefone,
                passwordHash,
                role
            ]);


        const utilizadorId =
            resultadoUtilizador.insertId;


        // ==================================================
        // 11. SE FOR TÉCNICO, CRIAR PERFIL
        // ==================================================

        let tecnicoId = null;


        if (role === 'tecnico') {

            const [resultadoTecnico] =
                await connection.query(`
                    INSERT INTO tecnicos (
                        utilizador_id,
                        disponivel,
                        avaliacao,
                        servicos_concluidos
                    )
                    VALUES (?, ?, ?, ?)
                `, [
                    utilizadorId,
                    1,
                    0,
                    0
                ]);


            tecnicoId =
                resultadoTecnico.insertId;


            // ==================================================
            // 12. ASSOCIAR ESPECIALIDADES AO TÉCNICO
            // ==================================================

            for (const categoriaId of idsUnicos) {

                await connection.query(`
                    INSERT INTO tecnico_especialidades (
                        tecnico_id,
                        categoria_id
                    )
                    VALUES (?, ?)
                `, [
                    tecnicoId,
                    categoriaId
                ]);
            }
        }


        // ==================================================
        // 13. CONFIRMAR TRANSAÇÃO
        // ==================================================

        await connection.commit();


        // ==================================================
        // 14. RESPOSTA
        // ==================================================

        res.status(201).json({

            mensagem:
                'Conta criada com sucesso.',

            utilizador: {
                id: utilizadorId,
                nome: nome,
                email: email,
                telefone: telefone,
                role: role
            },

            tecnico:
                role === 'tecnico'
                    ? {
                        id: tecnicoId,
                        especialidades: idsUnicos
                    }
                    : null
        });


    } catch (erro) {

        // ==================================================
        // DESFAZER TRANSAÇÃO
        // ==================================================

        if (connection) {
            try {
                await connection.rollback();
            } catch { }
        }


        console.error(
            'Erro ao criar conta:',
            erro
        );


        // ==================================================
        // EMAIL DUPLICADO
        // ==================================================

        if (erro.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({
                erro:
                    'Já existe uma conta com este email.'
            });
        }


        // ==================================================
        // OUTRO ERRO
        // ==================================================

        res.status(500).json({
            erro: 'Erro ao criar conta.'
        });


    } finally {

        // ==================================================
        // LIBERTAR LIGAÇÃO
        // ==================================================

        if (connection) {
            connection.release();
        }
    }
});

// ======================================================
// PEDIDOS
// ======================================================

// Obter todos os pedidos
app.get('/api/pedidos', async (req, res) => {
    try {
        const [pedidos] = await db.query(`
            SELECT
                p.id,
                p.cliente_id,
                p.categoria_id,
                u.nome AS cliente,
                c.nome AS categoria,
                p.descricao,
                p.morada,
                p.cidade,
                p.data,
                p.status,
                p.prioridade,
                t.id AS tecnico_id,
                tecnico_user.nome AS tecnico
            FROM pedidos p
            INNER JOIN utilizadores u
                ON p.cliente_id = u.id
            INNER JOIN categorias c
                ON p.categoria_id = c.id
            LEFT JOIN tecnicos t
                ON p.tecnico_id = t.id
            LEFT JOIN utilizadores tecnico_user
                ON t.utilizador_id = tecnico_user.id
            ORDER BY p.data DESC, p.id DESC
        `);

        res.json(pedidos);

    } catch (erro) {
        console.error('Erro ao obter pedidos:', erro);

        res.status(500).json({
            erro: 'Erro ao obter os pedidos.'
        });
    }
});

// ======================================================
// GET - OBTER UM PEDIDO COM FOTOGRAFIAS
// ======================================================

app.get('/api/pedidos/:id', async (req, res) => {
    try {
        const { id } = req.params;

        // Procurar o pedido
        const [pedidos] = await db.query(`
            SELECT
                p.id,
                p.cliente_id,
                p.categoria_id,
                u.nome AS cliente,
                c.nome AS categoria,
                p.descricao,
                p.morada,
                p.cidade,
                p.data,
                p.status,
                p.prioridade,
                p.tecnico_id,
                tecnico_user.nome AS tecnico
            FROM pedidos p
            INNER JOIN utilizadores u
                ON p.cliente_id = u.id
            INNER JOIN categorias c
                ON p.categoria_id = c.id
            LEFT JOIN tecnicos t
                ON p.tecnico_id = t.id
            LEFT JOIN utilizadores tecnico_user
                ON t.utilizador_id = tecnico_user.id
            WHERE p.id = ?
        `, [id]);

        if (pedidos.length === 0) {
            return res.status(404).json({
                erro: 'Pedido não encontrado.'
            });
        }

        // Procurar fotografias associadas ao pedido
        const [fotografias] = await db.query(`
            SELECT
                id,
                caminho
            FROM fotos_pedidos
            WHERE pedido_id = ?
            ORDER BY id
        `, [id]);

        // Devolver o pedido com as fotografias
        res.json({
            ...pedidos[0],
            fotos: fotografias.map(foto => foto.caminho)
        });

    } catch (erro) {
        console.error('Erro ao obter pedido:', erro);

        res.status(500).json({
            erro: 'Erro ao obter o pedido.'
        });
    }
});

// Criar novo pedido
app.post('/api/pedidos', uploadImagem.single('imagem'), async (req, res) => {
    try {
        const {
            cliente_id,
            categoria_id,
            descricao,
            morada,
            cidade,
            data,
            status = 'pendente',
            prioridade = 'media',
            tecnico_id = null
        } = req.body;

        if (
            !cliente_id ||
            !categoria_id ||
            !descricao?.trim() ||
            !morada?.trim() ||
            !cidade?.trim() ||
            !data
        ) {
            return res.status(400).json({
                erro: 'Cliente, categoria, descrição, morada, cidade e data são obrigatórios.'
            });
        }

        const [ultimoPedido] = await db.query(`
            SELECT
                MAX(
                    CAST(
                        SUBSTRING(id, 3)
                        AS UNSIGNED
                    )
                ) AS ultimo_numero
            FROM pedidos
            WHERE id LIKE 'P-%'
        `);

        const ultimoNumero =
            Number(ultimoPedido[0].ultimo_numero) || 2400;

        const novoId = `P-${ultimoNumero + 1}`;

        await db.query(`
            INSERT INTO pedidos
            (
                id,
                cliente_id,
                categoria_id,
                descricao,
                morada,
                cidade,
                data,
                status,
                prioridade,
                tecnico_id
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
            novoId,
            cliente_id,
            categoria_id,
            descricao.trim(),
            morada.trim(),
            cidade.trim(),
            data,
            status,
            prioridade,
            tecnico_id || null
        ]);

        // Guardar fotografia associada ao pedido
        if (req.file) {
            const caminhoImagem = `/uploads/pedidos/${req.file.filename}`;

            await db.query(`
        INSERT INTO fotos_pedidos (pedido_id, caminho)
        VALUES (?, ?)
    `, [novoId, caminhoImagem]);
        }

        res.status(201).json({
            id: novoId,
            mensagem: 'Pedido criado com sucesso.',
            imagem: req.file
                ? `/uploads/pedidos/${req.file.filename}`
                : null
        });

    } catch (erro) {
        console.error('Erro ao criar pedido:', erro);

        res.status(500).json({
            erro: 'Erro ao criar o pedido.'
        });
    }
});

// Atualizar pedido
app.put('/api/pedidos/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const {
            cliente_id,
            categoria_id,
            descricao,
            morada,
            cidade,
            data,
            status,
            prioridade,
            tecnico_id = null
        } = req.body;

        if (
            !cliente_id ||
            !categoria_id ||
            !descricao?.trim() ||
            !morada?.trim() ||
            !cidade?.trim() ||
            !data ||
            !status ||
            !prioridade
        ) {
            return res.status(400).json({
                erro: 'Existem campos obrigatórios por preencher.'
            });
        }

        const [resultado] = await db.query(`
            UPDATE pedidos
            SET
                cliente_id = ?,
                categoria_id = ?,
                descricao = ?,
                morada = ?,
                cidade = ?,
                data = ?,
                status = ?,
                prioridade = ?,
                tecnico_id = ?
            WHERE id = ?
        `, [
            cliente_id,
            categoria_id,
            descricao.trim(),
            morada.trim(),
            cidade.trim(),
            data,
            status,
            prioridade,
            tecnico_id || null,
            id
        ]);

        if (resultado.affectedRows === 0) {
            return res.status(404).json({
                erro: 'Pedido não encontrado.'
            });
        }

        res.json({
            mensagem: 'Pedido atualizado com sucesso.'
        });

    } catch (erro) {
        console.error('Erro ao atualizar pedido:', erro);

        res.status(500).json({
            erro: 'Erro ao atualizar o pedido.'
        });
    }
});

// Remover pedido
app.delete('/api/pedidos/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const [resultado] = await db.query(`
            DELETE FROM pedidos
            WHERE id = ?
        `, [id]);

        if (resultado.affectedRows === 0) {
            return res.status(404).json({
                erro: 'Pedido não encontrado.'
            });
        }

        res.json({
            mensagem: 'Pedido removido com sucesso.'
        });

    } catch (erro) {
        console.error('Erro ao remover pedido:', erro);

        if (erro.code === 'ER_ROW_IS_REFERENCED_2') {
            return res.status(409).json({
                erro: 'Este pedido está ligado a outros registos e não pode ser removido.'
            });
        }

        res.status(500).json({
            erro: 'Erro ao remover o pedido.'
        });
    }
});

// ======================================================
// CATEGORIAS
// ======================================================


// ======================================================
// GET - OBTER TODAS AS CATEGORIAS
// ======================================================

app.get('/api/categorias', async (req, res) => {
    try {
        const [categorias] = await db.query(`
            SELECT
                c.id,
                c.nome,
                c.descricao,
                COUNT(DISTINCT p.id) AS pedidos_ativos
            FROM categorias c
            LEFT JOIN pedidos p
                ON p.categoria_id = c.id
                AND p.status NOT IN ('concluido', 'cancelado')
            GROUP BY
                c.id,
                c.nome,
                c.descricao
            ORDER BY c.nome
        `);

        const resultado = categorias.map(categoria => ({
            ...categoria,
            pedidos_ativos: Number(categoria.pedidos_ativos)
        }));

        res.json(resultado);

    } catch (erro) {
        console.error('Erro ao obter categorias:', erro);

        res.status(500).json({
            erro: 'Erro ao obter as categorias.'
        });
    }
});


// ======================================================
// GET - OBTER UMA CATEGORIA
// ======================================================

app.get('/api/categorias/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const [categorias] = await db.query(`
            SELECT
                c.id,
                c.nome,
                c.descricao,
                COUNT(DISTINCT p.id) AS pedidos_ativos
            FROM categorias c
            LEFT JOIN pedidos p
                ON p.categoria_id = c.id
                AND p.status NOT IN ('concluido', 'cancelado')
            WHERE c.id = ?
            GROUP BY
                c.id,
                c.nome,
                c.descricao
        `, [id]);

        if (categorias.length === 0) {
            return res.status(404).json({
                erro: 'Categoria não encontrada.'
            });
        }

        const categoria = categorias[0];

        res.json({
            ...categoria,
            pedidos_ativos: Number(categoria.pedidos_ativos)
        });

    } catch (erro) {
        console.error('Erro ao obter categoria:', erro);

        res.status(500).json({
            erro: 'Erro ao obter a categoria.'
        });
    }
});


// ======================================================
// POST - CRIAR CATEGORIA
// ======================================================

app.post('/api/categorias', async (req, res) => {
    try {
        const nome = req.body.nome?.trim();
        const descricao = req.body.descricao?.trim() || null;

        // --------------------------------------------------
        // Validar nome
        // --------------------------------------------------

        if (!nome) {
            return res.status(400).json({
                erro: 'O nome da categoria é obrigatório.'
            });
        }

        if (nome.length > 100) {
            return res.status(400).json({
                erro: 'O nome da categoria não pode ter mais de 100 caracteres.'
            });
        }

        if (descricao && descricao.length > 255) {
            return res.status(400).json({
                erro: 'A descrição não pode ter mais de 255 caracteres.'
            });
        }

        // --------------------------------------------------
        // Verificar se já existe categoria com esse nome
        // --------------------------------------------------

        const [existentes] = await db.query(`
            SELECT id
            FROM categorias
            WHERE LOWER(nome) = LOWER(?)
            LIMIT 1
        `, [nome]);

        if (existentes.length > 0) {
            return res.status(409).json({
                erro: 'Já existe uma categoria com este nome.'
            });
        }

        // --------------------------------------------------
        // Criar categoria
        // --------------------------------------------------

        const [resultado] = await db.query(`
            INSERT INTO categorias
            (
                nome,
                descricao
            )
            VALUES (?, ?)
        `, [
            nome,
            descricao
        ]);

        res.status(201).json({
            id: resultado.insertId,
            nome,
            descricao,
            pedidos_ativos: 0,
            mensagem: 'Categoria criada com sucesso.'
        });

    } catch (erro) {
        console.error('Erro ao criar categoria:', erro);

        if (erro.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({
                erro: 'Já existe uma categoria com este nome.'
            });
        }

        res.status(500).json({
            erro: 'Erro ao criar a categoria.'
        });
    }
});


// ======================================================
// PUT - EDITAR CATEGORIA
// ======================================================

app.put('/api/categorias/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const nome = req.body.nome?.trim();
        const descricao = req.body.descricao?.trim() || null;

        // --------------------------------------------------
        // Validar nome
        // --------------------------------------------------

        if (!nome) {
            return res.status(400).json({
                erro: 'O nome da categoria é obrigatório.'
            });
        }

        if (nome.length > 100) {
            return res.status(400).json({
                erro: 'O nome da categoria não pode ter mais de 100 caracteres.'
            });
        }

        if (descricao && descricao.length > 255) {
            return res.status(400).json({
                erro: 'A descrição não pode ter mais de 255 caracteres.'
            });
        }

        // --------------------------------------------------
        // Verificar se a categoria existe
        // --------------------------------------------------

        const [categorias] = await db.query(`
            SELECT id
            FROM categorias
            WHERE id = ?
            LIMIT 1
        `, [id]);

        if (categorias.length === 0) {
            return res.status(404).json({
                erro: 'Categoria não encontrada.'
            });
        }

        // --------------------------------------------------
        // Verificar se outro registo já usa o mesmo nome
        // --------------------------------------------------

        const [existentes] = await db.query(`
            SELECT id
            FROM categorias
            WHERE LOWER(nome) = LOWER(?)
            AND id <> ?
            LIMIT 1
        `, [
            nome,
            id
        ]);

        if (existentes.length > 0) {
            return res.status(409).json({
                erro: 'Já existe outra categoria com este nome.'
            });
        }

        // --------------------------------------------------
        // Atualizar categoria
        // --------------------------------------------------

        await db.query(`
            UPDATE categorias
            SET
                nome = ?,
                descricao = ?
            WHERE id = ?
        `, [
            nome,
            descricao,
            id
        ]);

        res.json({
            mensagem: 'Categoria atualizada com sucesso.'
        });

    } catch (erro) {
        console.error('Erro ao atualizar categoria:', erro);

        if (erro.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({
                erro: 'Já existe outra categoria com este nome.'
            });
        }

        res.status(500).json({
            erro: 'Erro ao atualizar a categoria.'
        });
    }
});


// ======================================================
// DELETE - ELIMINAR CATEGORIA
// ======================================================

app.delete('/api/categorias/:id', async (req, res) => {
    let connection;

    try {
        const { id } = req.params;

        connection = await db.getConnection();

        await connection.beginTransaction();

        // --------------------------------------------------
        // Confirmar que a categoria existe
        // --------------------------------------------------

        const [categorias] = await connection.query(`
            SELECT
                id,
                nome
            FROM categorias
            WHERE id = ?
            LIMIT 1
        `, [id]);

        if (categorias.length === 0) {
            await connection.rollback();

            return res.status(404).json({
                erro: 'Categoria não encontrada.'
            });
        }

        // --------------------------------------------------
        // Verificar pedidos associados
        // --------------------------------------------------
        //
        // Não apagamos uma categoria que esteja a ser usada
        // por pedidos, porque isso quebraria a relação
        // categoria -> pedido.
        //

        const [pedidos] = await connection.query(`
            SELECT COUNT(*) AS total
            FROM pedidos
            WHERE categoria_id = ?
        `, [id]);

        const totalPedidos = Number(pedidos[0].total);

        if (totalPedidos > 0) {
            await connection.rollback();

            return res.status(409).json({
                erro:
                    'Não é possível eliminar esta categoria porque possui pedidos associados.'
            });
        }

        // --------------------------------------------------
        // Remover associações com técnicos
        // --------------------------------------------------

        await connection.query(`
            DELETE FROM tecnico_especialidades
            WHERE categoria_id = ?
        `, [id]);

        // --------------------------------------------------
        // Eliminar categoria
        // --------------------------------------------------

        const [resultado] = await connection.query(`
            DELETE FROM categorias
            WHERE id = ?
        `, [id]);

        if (resultado.affectedRows === 0) {
            await connection.rollback();

            return res.status(404).json({
                erro: 'Categoria não encontrada.'
            });
        }

        // --------------------------------------------------
        // Confirmar transação
        // --------------------------------------------------

        await connection.commit();

        res.json({
            mensagem: 'Categoria eliminada com sucesso.'
        });

    } catch (erro) {
        if (connection) {
            try {
                await connection.rollback();
            } catch { }
        }

        console.error('Erro ao eliminar categoria:', erro);

        if (erro.code === 'ER_ROW_IS_REFERENCED_2') {
            return res.status(409).json({
                erro:
                    'Esta categoria está associada a outros registos e não pode ser eliminada.'
            });
        }

        res.status(500).json({
            erro: 'Erro ao eliminar a categoria.'
        });

    } finally {
        if (connection) {
            connection.release();
        }
    }
});

// ======================================================
// TÉCNICOS
// ======================================================


// ======================================================
// GET - OBTER TODOS OS TÉCNICOS
// ======================================================
app.get('/api/tecnicos', async (req, res) => {
    try {
        const [tecnicos] = await db.query(`
            SELECT
                t.id,
                t.utilizador_id,
                u.nome,
                u.email,
                u.telefone,
                t.disponivel,
                t.avaliacao,
                t.servicos_concluidos,
                GROUP_CONCAT(
                    DISTINCT c.nome
                    ORDER BY c.nome
                    SEPARATOR ','
                ) AS especialidades
            FROM tecnicos t
            INNER JOIN utilizadores u
                ON t.utilizador_id = u.id
            LEFT JOIN tecnico_especialidades te
                ON te.tecnico_id = t.id
            LEFT JOIN categorias c
                ON c.id = te.categoria_id
            GROUP BY
                t.id,
                t.utilizador_id,
                u.nome,
                u.email,
                u.telefone,
                t.disponivel,
                t.avaliacao,
                t.servicos_concluidos
            ORDER BY u.nome
        `);

        const resultado = tecnicos.map(tecnico => ({
            ...tecnico,

            disponivel: Boolean(tecnico.disponivel),

            avaliacao:
                tecnico.avaliacao !== null
                    ? Number(tecnico.avaliacao)
                    : 0,

            servicos_concluidos:
                tecnico.servicos_concluidos !== null
                    ? Number(tecnico.servicos_concluidos)
                    : 0,

            especialidades:
                tecnico.especialidades
                    ? tecnico.especialidades.split(',')
                    : []
        }));

        res.json(resultado);

    } catch (erro) {
        console.error('Erro ao obter técnicos:', erro);

        res.status(500).json({
            erro: 'Erro ao obter os técnicos.'
        });
    }
});


// ======================================================
// GET - OBTER UM TÉCNICO
// ======================================================
app.get('/api/tecnicos/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const [tecnicos] = await db.query(`
            SELECT
                t.id,
                t.utilizador_id,
                u.nome,
                u.email,
                u.telefone,
                t.disponivel,
                t.avaliacao,
                t.servicos_concluidos,
                GROUP_CONCAT(
                    DISTINCT c.nome
                    ORDER BY c.nome
                    SEPARATOR ','
                ) AS especialidades
            FROM tecnicos t
            INNER JOIN utilizadores u
                ON t.utilizador_id = u.id
            LEFT JOIN tecnico_especialidades te
                ON te.tecnico_id = t.id
            LEFT JOIN categorias c
                ON c.id = te.categoria_id
            WHERE t.id = ?
            GROUP BY
                t.id,
                t.utilizador_id,
                u.nome,
                u.email,
                u.telefone,
                t.disponivel,
                t.avaliacao,
                t.servicos_concluidos
        `, [id]);

        if (tecnicos.length === 0) {
            return res.status(404).json({
                erro: 'Técnico não encontrado.'
            });
        }

        const tecnico = tecnicos[0];

        res.json({
            ...tecnico,

            disponivel: Boolean(tecnico.disponivel),

            avaliacao:
                tecnico.avaliacao !== null
                    ? Number(tecnico.avaliacao)
                    : 0,

            servicos_concluidos:
                tecnico.servicos_concluidos !== null
                    ? Number(tecnico.servicos_concluidos)
                    : 0,

            especialidades:
                tecnico.especialidades
                    ? tecnico.especialidades.split(',')
                    : []
        });

    } catch (erro) {
        console.error('Erro ao obter técnico:', erro);

        res.status(500).json({
            erro: 'Erro ao obter o técnico.'
        });
    }
});

// ======================================================
// POST - CRIAR TÉCNICO
// ======================================================
app.post('/api/tecnicos', async (req, res) => {
    let connection;

    try {
        const {
            nome,
            email,
            telefone,
            disponivel = true,
            avaliacao = 0,
            servicos_concluidos = 0,
            especialidades = []
        } = req.body;

        // ==================================================
        // 1. VALIDAÇÕES
        // ==================================================

        if (!nome || !nome.trim()) {
            return res.status(400).json({
                erro: 'O nome é obrigatório.'
            });
        }

        if (!email || !email.trim()) {
            return res.status(400).json({
                erro: 'O email é obrigatório.'
            });
        }

        if (!Array.isArray(especialidades)) {
            return res.status(400).json({
                erro: 'As especialidades devem ser enviadas numa lista.'
            });
        }

        const avaliacaoNumero = Number(avaliacao);
        const servicosNumero = Number(servicos_concluidos);

        if (
            Number.isNaN(avaliacaoNumero) ||
            avaliacaoNumero < 0 ||
            avaliacaoNumero > 5
        ) {
            return res.status(400).json({
                erro: 'A avaliação deve estar entre 0 e 5.'
            });
        }

        if (
            Number.isNaN(servicosNumero) ||
            servicosNumero < 0 ||
            !Number.isInteger(servicosNumero)
        ) {
            return res.status(400).json({
                erro: 'O número de serviços concluídos não é válido.'
            });
        }

        // ==================================================
        // 2. VALIDAR ESPECIALIDADES
        // ==================================================

        const idsCategorias = especialidades
            .map(id => Number(id))
            .filter(id => Number.isInteger(id) && id > 0);

        if (idsCategorias.length !== especialidades.length) {
            return res.status(400).json({
                erro: 'Existe uma especialidade inválida.'
            });
        }

        // Remover IDs repetidos
        const idsUnicos = [...new Set(idsCategorias)];

        // ==================================================
        // 3. INICIAR TRANSAÇÃO
        // ==================================================

        connection = await db.getConnection();

        await connection.beginTransaction();

        // ==================================================
        // 4. VERIFICAR SE O EMAIL JÁ EXISTE
        // ==================================================

        const [emailExistente] = await connection.query(`
            SELECT id
            FROM utilizadores
            WHERE email = ?
            LIMIT 1
        `, [
            email.trim()
        ]);

        if (emailExistente.length > 0) {
            await connection.rollback();

            return res.status(409).json({
                erro: 'Já existe um utilizador com este email.'
            });
        }

        // ==================================================
        // 5. VERIFICAR SE AS ESPECIALIDADES EXISTEM
        // ==================================================

        if (idsUnicos.length > 0) {
            const placeholders = idsUnicos
                .map(() => '?')
                .join(',');

            const [categoriasExistentes] =
                await connection.query(`
                    SELECT id
                    FROM categorias
                    WHERE id IN (${placeholders})
                `, idsUnicos);

            if (
                categoriasExistentes.length !==
                idsUnicos.length
            ) {
                await connection.rollback();

                return res.status(400).json({
                    erro: 'Uma ou mais especialidades não existem.'
                });
            }
        }

        // ==================================================
        // 6. CRIAR PASSWORD COM BCRYPT
        // ==================================================

        const passwordInicial = 'teste123';

        const passwordHash = await bcrypt.hash(
            passwordInicial,
            10
        );

        // ==================================================
        // 7. CRIAR UTILIZADOR
        // ==================================================

        const [resultadoUtilizador] =
            await connection.query(`
                INSERT INTO utilizadores (
                    nome,
                    email,
                    telefone,
                    password_hash,
                    role
                )
                VALUES (?, ?, ?, ?, 'tecnico')
            `, [
                nome.trim(),
                email.trim(),
                telefone?.trim() || null,
                passwordHash
            ]);

        const utilizadorId =
            resultadoUtilizador.insertId;

        // ==================================================
        // 8. CRIAR TÉCNICO
        // ==================================================

        const [resultadoTecnico] =
            await connection.query(`
                INSERT INTO tecnicos (
                    utilizador_id,
                    disponivel,
                    avaliacao,
                    servicos_concluidos
                )
                VALUES (?, ?, ?, ?)
            `, [
                utilizadorId,
                disponivel ? 1 : 0,
                avaliacaoNumero,
                servicosNumero
            ]);

        const tecnicoId =
            resultadoTecnico.insertId;

        // ==================================================
        // 9. GUARDAR ESPECIALIDADES
        // ==================================================

        for (const categoriaId of idsUnicos) {
            await connection.query(`
                INSERT INTO tecnico_especialidades (
                    tecnico_id,
                    categoria_id
                )
                VALUES (?, ?)
            `, [
                tecnicoId,
                categoriaId
            ]);
        }

        // ==================================================
        // 10. CONFIRMAR TRANSAÇÃO
        // ==================================================

        await connection.commit();

        // ==================================================
        // 11. DEVOLVER RESULTADO
        // ==================================================

        res.status(201).json({
            mensagem: 'Técnico criado com sucesso.',
            id: tecnicoId,
            utilizador_id: utilizadorId,
            nome: nome.trim(),
            email: email.trim(),
            telefone: telefone?.trim() || null,
            disponivel: Boolean(disponivel),
            avaliacao: avaliacaoNumero,
            servicos_concluidos: servicosNumero,
            especialidades: idsUnicos
        });

    } catch (erro) {

        // Desfazer alterações se alguma coisa falhar
        if (connection) {
            try {
                await connection.rollback();
            } catch { }
        }

        console.error('Erro ao criar técnico:', erro);

        // Email duplicado
        if (erro.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({
                erro: 'Já existe um utilizador com este email.'
            });
        }

        res.status(500).json({
            erro: 'Erro ao criar o técnico.'
        });

    } finally {

        // Libertar ligação à base de dados
        if (connection) {
            connection.release();
        }
    }
});

// ======================================================
// PUT - EDITAR TÉCNICO
// ======================================================
app.put('/api/tecnicos/:id', async (req, res) => {
    let connection;

    try {
        const { id } = req.params;

        const {
            nome,
            email,
            telefone,
            disponivel,
            avaliacao,
            servicos_concluidos,
            especialidades = []
        } = req.body;

        // ==================================================
        // 1. VALIDAÇÕES
        // ==================================================

        if (!nome || !nome.trim()) {
            return res.status(400).json({
                erro: 'O nome é obrigatório.'
            });
        }

        if (!email || !email.trim()) {
            return res.status(400).json({
                erro: 'O email é obrigatório.'
            });
        }

        if (!Array.isArray(especialidades)) {
            return res.status(400).json({
                erro: 'As especialidades devem ser enviadas numa lista.'
            });
        }

        const avaliacaoNumero = Number(avaliacao);
        const servicosNumero = Number(servicos_concluidos);

        if (
            Number.isNaN(avaliacaoNumero) ||
            avaliacaoNumero < 0 ||
            avaliacaoNumero > 5
        ) {
            return res.status(400).json({
                erro: 'A avaliação deve estar entre 0 e 5.'
            });
        }

        if (
            Number.isNaN(servicosNumero) ||
            servicosNumero < 0 ||
            !Number.isInteger(servicosNumero)
        ) {
            return res.status(400).json({
                erro: 'O número de serviços concluídos não é válido.'
            });
        }

        // ==================================================
        // 2. VALIDAR ESPECIALIDADES
        // ==================================================

        const idsCategorias = especialidades
            .map(id => Number(id))
            .filter(id => Number.isInteger(id) && id > 0);

        if (idsCategorias.length !== especialidades.length) {
            return res.status(400).json({
                erro: 'Existe uma especialidade inválida.'
            });
        }

        const idsUnicos = [...new Set(idsCategorias)];

        // ==================================================
        // 3. INICIAR TRANSAÇÃO
        // ==================================================

        connection = await db.getConnection();

        await connection.beginTransaction();

        // ==================================================
        // 4. PROCURAR TÉCNICO
        // ==================================================

        const [tecnicos] = await connection.query(`
            SELECT
                id,
                utilizador_id
            FROM tecnicos
            WHERE id = ?
            LIMIT 1
        `, [id]);

        if (tecnicos.length === 0) {
            await connection.rollback();

            return res.status(404).json({
                erro: 'Técnico não encontrado.'
            });
        }

        const utilizadorId =
            tecnicos[0].utilizador_id;

        // ==================================================
        // 5. VERIFICAR EMAIL
        // ==================================================

        const [emailExistente] = await connection.query(`
            SELECT id
            FROM utilizadores
            WHERE email = ?
            AND id <> ?
            LIMIT 1
        `, [
            email.trim(),
            utilizadorId
        ]);

        if (emailExistente.length > 0) {
            await connection.rollback();

            return res.status(409).json({
                erro: 'Já existe outro utilizador com este email.'
            });
        }

        // ==================================================
        // 6. VERIFICAR SE AS ESPECIALIDADES EXISTEM
        // ==================================================

        if (idsUnicos.length > 0) {
            const placeholders = idsUnicos
                .map(() => '?')
                .join(',');

            const [categoriasExistentes] =
                await connection.query(`
                    SELECT id
                    FROM categorias
                    WHERE id IN (${placeholders})
                `, idsUnicos);

            if (
                categoriasExistentes.length !==
                idsUnicos.length
            ) {
                await connection.rollback();

                return res.status(400).json({
                    erro: 'Uma ou mais especialidades não existem.'
                });
            }
        }

        // ==================================================
        // 7. ATUALIZAR UTILIZADOR
        // ==================================================

        await connection.query(`
            UPDATE utilizadores
            SET
                nome = ?,
                email = ?,
                telefone = ?
            WHERE id = ?
            AND role = 'tecnico'
        `, [
            nome.trim(),
            email.trim(),
            telefone?.trim() || null,
            utilizadorId
        ]);

        // ==================================================
        // 8. ATUALIZAR TÉCNICO
        // ==================================================

        await connection.query(`
            UPDATE tecnicos
            SET
                disponivel = ?,
                avaliacao = ?,
                servicos_concluidos = ?
            WHERE id = ?
        `, [
            disponivel ? 1 : 0,
            avaliacaoNumero,
            servicosNumero,
            id
        ]);

        // ==================================================
        // 9. APAGAR ESPECIALIDADES ANTIGAS
        // ==================================================

        await connection.query(`
            DELETE FROM tecnico_especialidades
            WHERE tecnico_id = ?
        `, [id]);

        // ==================================================
        // 10. GUARDAR NOVAS ESPECIALIDADES
        // ==================================================

        for (const categoriaId of idsUnicos) {
            await connection.query(`
                INSERT INTO tecnico_especialidades (
                    tecnico_id,
                    categoria_id
                )
                VALUES (?, ?)
            `, [
                id,
                categoriaId
            ]);
        }

        // ==================================================
        // 11. CONFIRMAR TRANSAÇÃO
        // ==================================================

        await connection.commit();

        res.json({
            mensagem: 'Técnico atualizado com sucesso.'
        });

    } catch (erro) {

        // Desfazer alterações em caso de erro
        if (connection) {
            try {
                await connection.rollback();
            } catch { }
        }

        console.error(
            'Erro ao atualizar técnico:',
            erro
        );

        // Email duplicado
        if (erro.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({
                erro: 'Já existe outro utilizador com este email.'
            });
        }

        res.status(500).json({
            erro: 'Erro ao atualizar o técnico.'
        });

    } finally {

        // Libertar ligação
        if (connection) {
            connection.release();
        }
    }
});

// ======================================================
// DELETE - ELIMINAR TÉCNICO
// ======================================================
app.delete('/api/tecnicos/:id', async (req, res) => {
    let connection;

    try {
        const { id } = req.params;

        // ==================================================
        // 1. INICIAR TRANSAÇÃO
        // ==================================================

        connection = await db.getConnection();

        await connection.beginTransaction();

        // ==================================================
        // 2. PROCURAR TÉCNICO
        // ==================================================

        const [tecnicos] = await connection.query(`
            SELECT
                id,
                utilizador_id
            FROM tecnicos
            WHERE id = ?
            LIMIT 1
        `, [id]);

        if (tecnicos.length === 0) {
            await connection.rollback();

            return res.status(404).json({
                erro: 'Técnico não encontrado.'
            });
        }

        const utilizadorId =
            tecnicos[0].utilizador_id;

        // ==================================================
        // 3. DESASSOCIAR TÉCNICO DOS PEDIDOS
        // ==================================================

        await connection.query(`
            UPDATE pedidos
            SET tecnico_id = NULL
            WHERE tecnico_id = ?
        `, [id]);

        // ==================================================
        // 4. ELIMINAR AGENDAMENTOS DO TÉCNICO
        // ==================================================

        await connection.query(`
            DELETE FROM agendamentos
            WHERE tecnico_id = ?
        `, [id]);

        // ==================================================
        // 5. ELIMINAR ESPECIALIDADES DO TÉCNICO
        // ==================================================

        await connection.query(`
            DELETE FROM tecnico_especialidades
            WHERE tecnico_id = ?
        `, [id]);

        // ==================================================
        // 6. ELIMINAR TÉCNICO
        // ==================================================

        const [resultadoTecnico] =
            await connection.query(`
                DELETE FROM tecnicos
                WHERE id = ?
            `, [id]);

        if (resultadoTecnico.affectedRows === 0) {
            await connection.rollback();

            return res.status(404).json({
                erro: 'Técnico não encontrado.'
            });
        }

        // ==================================================
        // 7. ELIMINAR UTILIZADOR ASSOCIADO
        // ==================================================

        await connection.query(`
            DELETE FROM utilizadores
            WHERE id = ?
            AND role = 'tecnico'
        `, [utilizadorId]);

        // ==================================================
        // 8. CONFIRMAR TRANSAÇÃO
        // ==================================================

        await connection.commit();

        res.json({
            mensagem: 'Técnico eliminado com sucesso.'
        });

    } catch (erro) {

        // Desfazer alterações em caso de erro
        if (connection) {
            try {
                await connection.rollback();
            } catch { }
        }

        console.error(
            'Erro ao eliminar técnico:',
            erro
        );

        res.status(500).json({
            erro: 'Erro ao eliminar o técnico.'
        });

    } finally {

        // Libertar ligação à base de dados
        if (connection) {
            connection.release();
        }
    }
});




// ======================================================
// CLIENTES
// ======================================================


// ======================================================
// GET - OBTER TODOS OS CLIENTES
// ======================================================
app.get('/api/clientes', async (req, res) => {
    try {
        const [clientes] = await db.query(`
            SELECT
                u.id,
                u.nome,
                u.email,
                u.telefone,
                COUNT(DISTINCT p.id) AS pedidos,
                COALESCE(
                    SUM(
                        CASE
                            WHEN pg.status = 'pago'
                            THEN pg.valor
                            ELSE 0
                        END
                    ),
                    0
                ) AS total_gasto
            FROM utilizadores u
            LEFT JOIN pedidos p
                ON p.cliente_id = u.id
            LEFT JOIN pagamentos pg
                ON pg.pedido_id = p.id
            WHERE u.role = 'cliente'
            GROUP BY
                u.id,
                u.nome,
                u.email,
                u.telefone
            ORDER BY u.nome
        `);

        // Converter valores numéricos
        const resultado = clientes.map(cliente => ({
            ...cliente,

            pedidos:
                Number(cliente.pedidos),

            total_gasto:
                Number(cliente.total_gasto)
        }));

        res.json(resultado);

    } catch (erro) {
        console.error(
            'Erro ao obter clientes:',
            erro
        );

        res.status(500).json({
            erro: 'Erro ao obter os clientes.'
        });
    }
});


// ======================================================
// GET - OBTER UM CLIENTE
// ======================================================
app.get('/api/clientes/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const [clientes] = await db.query(`
            SELECT
                u.id,
                u.nome,
                u.email,
                u.telefone,
                COUNT(DISTINCT p.id) AS pedidos,
                COALESCE(
                    SUM(
                        CASE
                            WHEN pg.status = 'pago'
                            THEN pg.valor
                            ELSE 0
                        END
                    ),
                    0
                ) AS total_gasto
            FROM utilizadores u
            LEFT JOIN pedidos p
                ON p.cliente_id = u.id
            LEFT JOIN pagamentos pg
                ON pg.pedido_id = p.id
            WHERE u.id = ?
            AND u.role = 'cliente'
            GROUP BY
                u.id,
                u.nome,
                u.email,
                u.telefone
        `, [id]);

        if (clientes.length === 0) {
            return res.status(404).json({
                erro: 'Cliente não encontrado.'
            });
        }

        const cliente = clientes[0];

        res.json({
            ...cliente,

            pedidos:
                Number(cliente.pedidos),

            total_gasto:
                Number(cliente.total_gasto)
        });

    } catch (erro) {
        console.error(
            'Erro ao obter cliente:',
            erro
        );

        res.status(500).json({
            erro: 'Erro ao obter o cliente.'
        });
    }
});

// ======================================================
// POST - CRIAR CLIENTE
// ======================================================
app.post('/api/clientes', async (req, res) => {
    try {
        const nome = req.body.nome?.trim();
        const email = req.body.email?.trim();
        const telefone = req.body.telefone?.trim() || null;

        // ==================================================
        // 1. VALIDAR CAMPOS OBRIGATÓRIOS
        // ==================================================

        if (!nome || !email) {
            return res.status(400).json({
                erro: 'Nome e email são obrigatórios.'
            });
        }

        // ==================================================
        // 2. VERIFICAR SE O EMAIL JÁ EXISTE
        // ==================================================

        const [existentes] = await db.query(`
            SELECT id
            FROM utilizadores
            WHERE email = ?
            LIMIT 1
        `, [email]);

        if (existentes.length > 0) {
            return res.status(409).json({
                erro: 'Já existe um utilizador com este email.'
            });
        }

        // ==================================================
        // 3. CRIAR PASSWORD INICIAL COM BCRYPT
        // ==================================================

        const passwordInicial = 'teste123';

        const passwordHash = await bcrypt.hash(
            passwordInicial,
            10
        );

        // ==================================================
        // 4. CRIAR UTILIZADOR COM ROLE CLIENTE
        // ==================================================

        const [resultado] = await db.query(`
            INSERT INTO utilizadores (
                nome,
                email,
                telefone,
                password_hash,
                role
            )
            VALUES (?, ?, ?, ?, ?)
        `, [
            nome,
            email,
            telefone,
            passwordHash,
            'cliente'
        ]);

        // ==================================================
        // 5. DEVOLVER CLIENTE CRIADO
        // ==================================================

        res.status(201).json({
            id: resultado.insertId,
            nome,
            email,
            telefone,
            pedidos: 0,
            total_gasto: 0
        });

    } catch (erro) {
        console.error(
            'Erro ao adicionar cliente:',
            erro
        );

        // Email duplicado
        if (erro.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({
                erro: 'Já existe um utilizador com este email.'
            });
        }

        res.status(500).json({
            erro: 'Erro ao adicionar o cliente.'
        });
    }
});

// ======================================================
// PUT - ATUALIZAR CLIENTE
// ======================================================
app.put('/api/clientes/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const nome = req.body.nome?.trim();
        const email = req.body.email?.trim();
        const telefone = req.body.telefone?.trim() || null;

        // ==================================================
        // 1. VALIDAR CAMPOS OBRIGATÓRIOS
        // ==================================================

        if (!nome || !email) {
            return res.status(400).json({
                erro: 'Nome e email são obrigatórios.'
            });
        }

        // ==================================================
        // 2. CONFIRMAR QUE O CLIENTE EXISTE
        // ==================================================

        const [clientes] = await db.query(`
            SELECT id
            FROM utilizadores
            WHERE id = ?
            AND role = 'cliente'
            LIMIT 1
        `, [id]);

        if (clientes.length === 0) {
            return res.status(404).json({
                erro: 'Cliente não encontrado.'
            });
        }

        // ==================================================
        // 3. VERIFICAR SE OUTRO UTILIZADOR JÁ USA O EMAIL
        // ==================================================

        const [existentes] = await db.query(`
            SELECT id
            FROM utilizadores
            WHERE email = ?
            AND id <> ?
            LIMIT 1
        `, [
            email,
            id
        ]);

        if (existentes.length > 0) {
            return res.status(409).json({
                erro: 'Já existe um utilizador com este email.'
            });
        }

        // ==================================================
        // 4. ATUALIZAR CLIENTE
        // ==================================================

        const [resultado] = await db.query(`
            UPDATE utilizadores
            SET
                nome = ?,
                email = ?,
                telefone = ?
            WHERE id = ?
            AND role = 'cliente'
        `, [
            nome,
            email,
            telefone,
            id
        ]);

        // ==================================================
        // 5. CONFIRMAR SE FOI ATUALIZADO
        // ==================================================

        if (resultado.affectedRows === 0) {
            return res.status(404).json({
                erro: 'Cliente não encontrado.'
            });
        }

        // ==================================================
        // 6. RESPOSTA
        // ==================================================

        res.json({
            mensagem: 'Cliente atualizado com sucesso.'
        });

    } catch (erro) {
        console.error(
            'Erro ao atualizar cliente:',
            erro
        );

        // Email duplicado
        if (erro.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({
                erro: 'Já existe um utilizador com este email.'
            });
        }

        res.status(500).json({
            erro: 'Erro ao atualizar o cliente.'
        });
    }
});

// ======================================================
// DELETE - ELIMINAR CLIENTE
// ======================================================
app.delete('/api/clientes/:id', async (req, res) => {
    let connection;

    try {
        const { id } = req.params;

        // ==================================================
        // 1. INICIAR TRANSAÇÃO
        // ==================================================

        connection = await db.getConnection();

        await connection.beginTransaction();

        // ==================================================
        // 2. CONFIRMAR QUE O CLIENTE EXISTE
        // ==================================================

        const [clientes] = await connection.query(`
            SELECT
                id,
                nome
            FROM utilizadores
            WHERE id = ?
            AND role = 'cliente'
            LIMIT 1
        `, [id]);

        if (clientes.length === 0) {
            await connection.rollback();

            return res.status(404).json({
                erro: 'Cliente não encontrado.'
            });
        }

        // ==================================================
        // 3. VERIFICAR SE O CLIENTE TEM PEDIDOS
        // ==================================================
        //
        // Não eliminamos automaticamente os pedidos,
        // porque podem existir orçamentos, pagamentos,
        // agendamentos e histórico associados.
        //

        const [pedidos] = await connection.query(`
            SELECT COUNT(*) AS total
            FROM pedidos
            WHERE cliente_id = ?
        `, [id]);

        const totalPedidos = Number(
            pedidos[0].total
        );

        // ==================================================
        // 4. IMPEDIR ELIMINAÇÃO SE EXISTIREM PEDIDOS
        // ==================================================

        if (totalPedidos > 0) {
            await connection.rollback();

            return res.status(409).json({
                erro:
                    'Não é possível eliminar este cliente porque possui pedidos associados.'
            });
        }

        // ==================================================
        // 5. ELIMINAR CLIENTE
        // ==================================================

        const [resultado] = await connection.query(`
            DELETE FROM utilizadores
            WHERE id = ?
            AND role = 'cliente'
        `, [id]);

        // ==================================================
        // 6. CONFIRMAR SE FOI ELIMINADO
        // ==================================================

        if (resultado.affectedRows === 0) {
            await connection.rollback();

            return res.status(404).json({
                erro: 'Cliente não encontrado.'
            });
        }

        // ==================================================
        // 7. CONFIRMAR TRANSAÇÃO
        // ==================================================

        await connection.commit();

        res.json({
            mensagem: 'Cliente eliminado com sucesso.'
        });

    } catch (erro) {

        // ==================================================
        // DESFAZER TRANSAÇÃO EM CASO DE ERRO
        // ==================================================

        if (connection) {
            try {
                await connection.rollback();
            } catch { }
        }

        console.error(
            'Erro ao eliminar cliente:',
            erro
        );

        res.status(500).json({
            erro: 'Erro ao eliminar o cliente.'
        });

    } finally {

        // ==================================================
        // LIBERTAR LIGAÇÃO À BASE DE DADOS
        // ==================================================

        if (connection) {
            connection.release();
        }
    }
});


// ======================================================
// ORÇAMENTOS
// ======================================================

// ======================================================
// Obter todos os orçamentos
// ======================================================

app.get('/api/orcamentos', async (req, res) => {
    try {
        const [orcamentos] = await db.query(`
            SELECT
                o.id,
                o.pedido_id,
                u.nome AS cliente,
                c.nome AS servico,
                o.valor,
                o.validade,
                o.status
            FROM orcamentos o
            INNER JOIN pedidos p
                ON o.pedido_id = p.id
            INNER JOIN utilizadores u
                ON p.cliente_id = u.id
            INNER JOIN categorias c
                ON p.categoria_id = c.id
            ORDER BY o.id DESC
        `);

        for (const orcamento of orcamentos) {
            const [itens] = await db.query(`
                SELECT
                    id,
                    descricao,
                    valor
                FROM itens_orcamento
                WHERE orcamento_id = ?
                ORDER BY id
            `, [orcamento.id]);

            orcamento.itens = itens;
        }

        res.json(orcamentos);

    } catch (erro) {
        console.error('Erro ao obter orçamentos:', erro);

        res.status(500).json({
            erro: 'Erro ao obter os orçamentos.'
        });
    }
});

// ======================================================
// Obter um orçamento
// ======================================================

app.get('/api/orcamentos/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const [orcamentos] = await db.query(`
            SELECT
                o.id,
                o.pedido_id,
                u.nome AS cliente,
                c.nome AS servico,
                o.valor,
                o.validade,
                o.status
            FROM orcamentos o
            INNER JOIN pedidos p
                ON o.pedido_id = p.id
            INNER JOIN utilizadores u
                ON p.cliente_id = u.id
            INNER JOIN categorias c
                ON p.categoria_id = c.id
            WHERE o.id = ?
        `, [id]);

        if (orcamentos.length === 0) {
            return res.status(404).json({
                erro: 'Orçamento não encontrado.'
            });
        }

        const orcamento = orcamentos[0];

        const [itens] = await db.query(`
            SELECT
                id,
                descricao,
                valor
            FROM itens_orcamento
            WHERE orcamento_id = ?
            ORDER BY id
        `, [id]);

        orcamento.itens = itens;

        res.json(orcamento);

    } catch (erro) {
        console.error('Erro ao obter orçamento:', erro);

        res.status(500).json({
            erro: 'Erro ao obter o orçamento.'
        });
    }
});

// ======================================================
// Criar orçamento
// ======================================================

app.post('/api/orcamentos', async (req, res) => {
    let ligacao;

    try {
        const {
            pedido_id,
            validade,
            status = 'pendente',
            itens = []
        } = req.body;

        // Verificar campos obrigatórios
        if (!pedido_id || !validade) {
            return res.status(400).json({
                erro: 'Pedido e validade são obrigatórios.'
            });
        }

        // O orçamento deve ter pelo menos um item
        if (!Array.isArray(itens) || itens.length === 0) {
            return res.status(400).json({
                erro: 'O orçamento deve ter pelo menos um item.'
            });
        }

        // Estados permitidos
        const estadosValidos = [
            'pendente',
            'aceite',
            'rejeitado'
        ];

        if (!estadosValidos.includes(status)) {
            return res.status(400).json({
                erro: 'Estado do orçamento inválido.'
            });
        }

        // Verificar se o pedido existe
        const [pedidos] = await db.query(`
            SELECT id
            FROM pedidos
            WHERE id = ?
        `, [pedido_id]);

        if (pedidos.length === 0) {
            return res.status(404).json({
                erro: 'Pedido não encontrado.'
            });
        }

        // Validar os itens
        for (const item of itens) {
            if (
                !item.descricao?.trim() ||
                item.valor === undefined ||
                item.valor === null ||
                Number.isNaN(Number(item.valor)) ||
                Number(item.valor) < 0
            ) {
                return res.status(400).json({
                    erro: 'Todos os itens devem ter descrição e um valor válido.'
                });
            }
        }

        // Calcular automaticamente o valor total
        const valorTotal = itens.reduce(
            (total, item) => total + Number(item.valor),
            0
        );

        // Procurar o último ID ORC-XXX utilizado
        const [ultimoOrcamento] = await db.query(`
            SELECT
                MAX(
                    CAST(
                        SUBSTRING(id, 5)
                        AS UNSIGNED
                    )
                ) AS ultimo_numero
            FROM orcamentos
            WHERE id LIKE 'ORC-%'
        `);

        const ultimoNumero =
            Number(ultimoOrcamento[0].ultimo_numero) || 0;

        // Exemplo:
        // ORC-001
        // ORC-002
        // ORC-003
        // ORC-004
        const novoId =
            `ORC-${String(ultimoNumero + 1).padStart(3, '0')}`;

        // Obter uma ligação do pool
        ligacao = await db.getConnection();

        // Começar transação
        await ligacao.beginTransaction();

        // Criar orçamento
        await ligacao.query(`
            INSERT INTO orcamentos
            (
                id,
                pedido_id,
                valor,
                validade,
                status
            )
            VALUES (?, ?, ?, ?, ?)
        `, [
            novoId,
            pedido_id,
            valorTotal,
            validade,
            status
        ]);

        // Criar os itens do orçamento
        for (const item of itens) {
            await ligacao.query(`
                INSERT INTO itens_orcamento
                (
                    orcamento_id,
                    descricao,
                    valor
                )
                VALUES (?, ?, ?)
            `, [
                novoId,
                item.descricao.trim(),
                Number(item.valor)
            ]);
        }

        // Confirmar tudo na base de dados
        await ligacao.commit();

        res.status(201).json({
            id: novoId,
            pedido_id,
            valor: valorTotal,
            validade,
            status,
            itens,
            mensagem: 'Orçamento criado com sucesso.'
        });

    } catch (erro) {
        // Se alguma operação falhar,
        // desfazer tudo
        if (ligacao) {
            try {
                await ligacao.rollback();
            } catch (erroRollback) {
                console.error(
                    'Erro ao desfazer transação:',
                    erroRollback
                );
            }
        }

        console.error('Erro ao criar orçamento:', erro);

        res.status(500).json({
            erro: 'Erro ao criar o orçamento.'
        });

    } finally {
        // Libertar a ligação
        if (ligacao) {
            ligacao.release();
        }
    }
});

// ======================================================
// Atualizar orçamento
// ======================================================

app.put('/api/orcamentos/:id', async (req, res) => {
    let ligacao;

    try {
        const { id } = req.params;

        const {
            pedido_id,
            validade,
            status,
            itens = []
        } = req.body;

        // Verificar campos obrigatórios
        if (!pedido_id || !validade || !status) {
            return res.status(400).json({
                erro: 'Pedido, validade e estado são obrigatórios.'
            });
        }

        const estadosValidos = [
            'pendente',
            'aceite',
            'rejeitado'
        ];

        if (!estadosValidos.includes(status)) {
            return res.status(400).json({
                erro: 'Estado do orçamento inválido.'
            });
        }

        // Tem de existir pelo menos um item
        if (!Array.isArray(itens) || itens.length === 0) {
            return res.status(400).json({
                erro: 'O orçamento deve ter pelo menos um item.'
            });
        }

        // Verificar se o orçamento existe
        const [orcamentos] = await db.query(`
            SELECT id
            FROM orcamentos
            WHERE id = ?
        `, [id]);

        if (orcamentos.length === 0) {
            return res.status(404).json({
                erro: 'Orçamento não encontrado.'
            });
        }

        // Verificar se o pedido existe
        const [pedidos] = await db.query(`
            SELECT id
            FROM pedidos
            WHERE id = ?
        `, [pedido_id]);

        if (pedidos.length === 0) {
            return res.status(404).json({
                erro: 'Pedido não encontrado.'
            });
        }

        // Validar itens
        for (const item of itens) {
            if (
                !item.descricao?.trim() ||
                item.valor === undefined ||
                item.valor === null ||
                Number.isNaN(Number(item.valor)) ||
                Number(item.valor) < 0
            ) {
                return res.status(400).json({
                    erro: 'Todos os itens devem ter descrição e um valor válido.'
                });
            }
        }

        // Recalcular o total
        const valorTotal = itens.reduce(
            (total, item) => total + Number(item.valor),
            0
        );

        ligacao = await db.getConnection();

        await ligacao.beginTransaction();

        // Atualizar orçamento
        await ligacao.query(`
            UPDATE orcamentos
            SET
                pedido_id = ?,
                valor = ?,
                validade = ?,
                status = ?
            WHERE id = ?
        `, [
            pedido_id,
            valorTotal,
            validade,
            status,
            id
        ]);

        // Apagar os itens antigos
        await ligacao.query(`
            DELETE FROM itens_orcamento
            WHERE orcamento_id = ?
        `, [id]);

        // Guardar os novos itens
        for (const item of itens) {
            await ligacao.query(`
                INSERT INTO itens_orcamento
                (
                    orcamento_id,
                    descricao,
                    valor
                )
                VALUES (?, ?, ?)
            `, [
                id,
                item.descricao.trim(),
                Number(item.valor)
            ]);
        }

        // Confirmar alterações
        await ligacao.commit();

        res.json({
            id,
            pedido_id,
            valor: valorTotal,
            validade,
            status,
            itens,
            mensagem: 'Orçamento atualizado com sucesso.'
        });

    } catch (erro) {
        if (ligacao) {
            try {
                await ligacao.rollback();
            } catch (erroRollback) {
                console.error(
                    'Erro ao desfazer transação:',
                    erroRollback
                );
            }
        }

        console.error('Erro ao atualizar orçamento:', erro);

        res.status(500).json({
            erro: 'Erro ao atualizar o orçamento.'
        });

    } finally {
        if (ligacao) {
            ligacao.release();
        }
    }
});

// ======================================================
// Remover orçamento
// ======================================================

app.delete('/api/orcamentos/:id', async (req, res) => {
    let ligacao;

    try {
        const { id } = req.params;

        // Verificar se existe
        const [orcamentos] = await db.query(`
            SELECT id
            FROM orcamentos
            WHERE id = ?
        `, [id]);

        if (orcamentos.length === 0) {
            return res.status(404).json({
                erro: 'Orçamento não encontrado.'
            });
        }

        ligacao = await db.getConnection();

        await ligacao.beginTransaction();

        // Primeiro apagar os itens
        await ligacao.query(`
            DELETE FROM itens_orcamento
            WHERE orcamento_id = ?
        `, [id]);

        // Depois apagar o orçamento
        await ligacao.query(`
            DELETE FROM orcamentos
            WHERE id = ?
        `, [id]);

        await ligacao.commit();

        res.json({
            mensagem: 'Orçamento removido com sucesso.'
        });

    } catch (erro) {
        if (ligacao) {
            try {
                await ligacao.rollback();
            } catch (erroRollback) {
                console.error(
                    'Erro ao desfazer transação:',
                    erroRollback
                );
            }
        }

        console.error('Erro ao remover orçamento:', erro);

        if (erro.code === 'ER_ROW_IS_REFERENCED_2') {
            return res.status(409).json({
                erro: 'Este orçamento está ligado a outros registos e não pode ser removido.'
            });
        }

        res.status(500).json({
            erro: 'Erro ao remover o orçamento.'
        });

    } finally {
        if (ligacao) {
            ligacao.release();
        }
    }
});

// ======================================================
// AGENDAMENTOS
// ======================================================

// Obter todos os agendamentos
app.get('/api/agendamentos', async (req, res) => {
    try {
        const [agendamentos] = await db.query(`
            SELECT
                a.id,
                a.pedido_id,
                a.tecnico_id,
                cliente.nome AS cliente,
                tecnico_user.nome AS tecnico,
                c.nome AS servico,
                DATE_FORMAT(a.data, '%Y-%m-%d') AS data,
                TIME_FORMAT(a.hora, '%H:%i') AS hora,
                a.duracao,
                a.status
            FROM agendamentos a
            INNER JOIN pedidos p
                ON a.pedido_id = p.id
            INNER JOIN utilizadores cliente
                ON p.cliente_id = cliente.id
            INNER JOIN categorias c
                ON p.categoria_id = c.id
            INNER JOIN tecnicos t
                ON a.tecnico_id = t.id
            INNER JOIN utilizadores tecnico_user
                ON t.utilizador_id = tecnico_user.id
            ORDER BY a.data, a.hora
        `);

        res.json(agendamentos);

    } catch (erro) {
        console.error('Erro ao obter agendamentos:', erro);

        res.status(500).json({
            erro: 'Erro ao obter os agendamentos.'
        });
    }
});


// ======================================================
// OBTER UM AGENDAMENTO
// ======================================================

app.get('/api/agendamentos/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const [agendamentos] = await db.query(`
            SELECT
                a.id,
                a.pedido_id,
                a.tecnico_id,
                cliente.nome AS cliente,
                tecnico_user.nome AS tecnico,
                c.nome AS servico,
                DATE_FORMAT(a.data, '%Y-%m-%d') AS data,
                TIME_FORMAT(a.hora, '%H:%i') AS hora,
                a.duracao,
                a.status
            FROM agendamentos a
            INNER JOIN pedidos p
                ON a.pedido_id = p.id
            INNER JOIN utilizadores cliente
                ON p.cliente_id = cliente.id
            INNER JOIN categorias c
                ON p.categoria_id = c.id
            INNER JOIN tecnicos t
                ON a.tecnico_id = t.id
            INNER JOIN utilizadores tecnico_user
                ON t.utilizador_id = tecnico_user.id
            WHERE a.id = ?
        `, [id]);

        if (agendamentos.length === 0) {
            return res.status(404).json({
                erro: 'Agendamento não encontrado.'
            });
        }

        res.json(agendamentos[0]);

    } catch (erro) {
        console.error('Erro ao obter agendamento:', erro);

        res.status(500).json({
            erro: 'Erro ao obter o agendamento.'
        });
    }
});


// ======================================================
// CRIAR AGENDAMENTO
// ======================================================

app.post('/api/agendamentos', async (req, res) => {
    try {
        const {
            pedido_id,
            tecnico_id,
            data,
            hora,
            duracao,
            status
        } = req.body;

        // Validar campos obrigatórios
        if (
            !pedido_id ||
            !tecnico_id ||
            !data ||
            !hora ||
            !duracao
        ) {
            return res.status(400).json({
                erro: 'Preenche todos os campos obrigatórios.'
            });
        }

        // Validar estado
        const estadosPermitidos = [
            'confirmado',
            'em_curso',
            'concluido',
            'cancelado'
        ];

        const estadoFinal = status || 'confirmado';

        if (!estadosPermitidos.includes(estadoFinal)) {
            return res.status(400).json({
                erro: 'Estado do agendamento inválido.'
            });
        }

        // Verificar se o pedido existe
        const [pedidos] = await db.query(
            'SELECT id FROM pedidos WHERE id = ?',
            [pedido_id]
        );

        if (pedidos.length === 0) {
            return res.status(404).json({
                erro: 'Pedido não encontrado.'
            });
        }

        // Verificar se o técnico existe
        const [tecnicos] = await db.query(
            'SELECT id FROM tecnicos WHERE id = ?',
            [tecnico_id]
        );

        if (tecnicos.length === 0) {
            return res.status(404).json({
                erro: 'Técnico não encontrado.'
            });
        }

        // Descobrir o próximo ID AG-xxx
        const [ultimo] = await db.query(`
            SELECT id
            FROM agendamentos
            WHERE id LIKE 'AG-%'
            ORDER BY CAST(SUBSTRING(id, 4) AS UNSIGNED) DESC
            LIMIT 1
        `);

        let proximoNumero = 1;

        if (ultimo.length > 0) {
            const numeroAtual = parseInt(
                ultimo[0].id.replace('AG-', ''),
                10
            );

            proximoNumero = numeroAtual + 1;
        }

        const novoId =
            'AG-' + String(proximoNumero).padStart(3, '0');

        // Criar agendamento
        await db.query(`
            INSERT INTO agendamentos
            (
                id,
                pedido_id,
                tecnico_id,
                data,
                hora,
                duracao,
                status
            )
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `, [
            novoId,
            pedido_id,
            tecnico_id,
            data,
            hora,
            duracao,
            estadoFinal
        ]);

        // Atualizar o técnico associado ao pedido
        await db.query(`
            UPDATE pedidos
            SET tecnico_id = ?,
                status = 'agendado'
            WHERE id = ?
        `, [
            tecnico_id,
            pedido_id
        ]);

        res.status(201).json({
            mensagem: 'Agendamento criado com sucesso.',
            id: novoId
        });

    } catch (erro) {
        console.error('Erro ao criar agendamento:', erro);

        res.status(500).json({
            erro: 'Erro ao criar o agendamento.'
        });
    }
});


// ======================================================
// EDITAR AGENDAMENTO
// ======================================================

app.put('/api/agendamentos/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const {
            pedido_id,
            tecnico_id,
            data,
            hora,
            duracao,
            status
        } = req.body;

        if (
            !pedido_id ||
            !tecnico_id ||
            !data ||
            !hora ||
            !duracao ||
            !status
        ) {
            return res.status(400).json({
                erro: 'Preenche todos os campos obrigatórios.'
            });
        }

        const estadosPermitidos = [
            'confirmado',
            'em_curso',
            'concluido',
            'cancelado'
        ];

        if (!estadosPermitidos.includes(status)) {
            return res.status(400).json({
                erro: 'Estado do agendamento inválido.'
            });
        }

        // Verificar se o agendamento existe
        const [existente] = await db.query(
            'SELECT id FROM agendamentos WHERE id = ?',
            [id]
        );

        if (existente.length === 0) {
            return res.status(404).json({
                erro: 'Agendamento não encontrado.'
            });
        }

        // Verificar pedido
        const [pedidos] = await db.query(
            'SELECT id FROM pedidos WHERE id = ?',
            [pedido_id]
        );

        if (pedidos.length === 0) {
            return res.status(404).json({
                erro: 'Pedido não encontrado.'
            });
        }

        // Verificar técnico
        const [tecnicos] = await db.query(
            'SELECT id FROM tecnicos WHERE id = ?',
            [tecnico_id]
        );

        if (tecnicos.length === 0) {
            return res.status(404).json({
                erro: 'Técnico não encontrado.'
            });
        }

        // Atualizar agendamento
        await db.query(`
            UPDATE agendamentos
            SET
                pedido_id = ?,
                tecnico_id = ?,
                data = ?,
                hora = ?,
                duracao = ?,
                status = ?
            WHERE id = ?
        `, [
            pedido_id,
            tecnico_id,
            data,
            hora,
            duracao,
            status,
            id
        ]);

        // Atualizar técnico do pedido
        await db.query(`
            UPDATE pedidos
            SET tecnico_id = ?
            WHERE id = ?
        `, [
            tecnico_id,
            pedido_id
        ]);

        res.json({
            mensagem: 'Agendamento atualizado com sucesso.'
        });

    } catch (erro) {
        console.error('Erro ao atualizar agendamento:', erro);

        res.status(500).json({
            erro: 'Erro ao atualizar o agendamento.'
        });
    }
});


// ======================================================
// APAGAR AGENDAMENTO
// ======================================================

app.delete('/api/agendamentos/:id', async (req, res) => {
    try {
        const { id } = req.params;

        // Verificar se existe
        const [agendamentos] = await db.query(`
            SELECT pedido_id
            FROM agendamentos
            WHERE id = ?
        `, [id]);

        if (agendamentos.length === 0) {
            return res.status(404).json({
                erro: 'Agendamento não encontrado.'
            });
        }

        const pedidoId = agendamentos[0].pedido_id;

        // Apagar agendamento
        await db.query(
            'DELETE FROM agendamentos WHERE id = ?',
            [id]
        );

        // Ao apagar o agendamento, retirar apenas o técnico associado.
        // O estado do pedido não é alterado automaticamente.
        await db.query(`
            UPDATE pedidos
            SET tecnico_id = NULL
            WHERE id = ?
        `, [pedidoId]);

        res.json({
            mensagem: 'Agendamento eliminado com sucesso.'
        });

    } catch (erro) {
        console.error('Erro ao eliminar agendamento:', erro);

        res.status(500).json({
            erro: 'Erro ao eliminar o agendamento.'
        });
    }
});

// ======================================================
// PAGAMENTOS
// ======================================================


// ======================================================
// GET - OBTER TODOS OS PAGAMENTOS
// ======================================================
app.get('/api/pagamentos', async (req, res) => {
    try {
        const [pagamentos] = await db.query(`
            SELECT
                pg.id,
                pg.pedido_id,
                u.nome AS cliente,
                p.descricao AS servico,
                pg.valor,
                DATE_FORMAT(pg.data, '%Y-%m-%d') AS data,
                pg.metodo,
                pg.status
            FROM pagamentos pg
            INNER JOIN pedidos p
                ON pg.pedido_id = p.id
            INNER JOIN utilizadores u
                ON p.cliente_id = u.id
            ORDER BY pg.data DESC
        `);

        res.json(pagamentos);

    } catch (erro) {
        console.error('Erro ao obter pagamentos:', erro);

        res.status(500).json({
            erro: 'Erro ao obter os pagamentos.'
        });
    }
});


// ======================================================
// GET - OBTER UM PAGAMENTO
// ======================================================
app.get('/api/pagamentos/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const [pagamentos] = await db.query(`
            SELECT
                pg.id,
                pg.pedido_id,
                u.nome AS cliente,
                p.descricao AS servico,
                pg.valor,
                DATE_FORMAT(pg.data, '%Y-%m-%d') AS data,
                pg.metodo,
                pg.status
            FROM pagamentos pg
            INNER JOIN pedidos p
                ON pg.pedido_id = p.id
            INNER JOIN utilizadores u
                ON p.cliente_id = u.id
            WHERE pg.id = ?
            LIMIT 1
        `, [id]);

        if (pagamentos.length === 0) {
            return res.status(404).json({
                erro: 'Pagamento não encontrado.'
            });
        }

        res.json(pagamentos[0]);

    } catch (erro) {
        console.error('Erro ao obter pagamento:', erro);

        res.status(500).json({
            erro: 'Erro ao obter o pagamento.'
        });
    }
});


// ======================================================
// PUT - ATUALIZAR ESTADO DO PAGAMENTO
// ======================================================
app.put('/api/pagamentos/:id/status', async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        // Estados permitidos na base de dados
        const estadosPermitidos = [
            'pendente',
            'pago',
            'falhado'
        ];

        if (!status) {
            return res.status(400).json({
                erro: 'O estado do pagamento é obrigatório.'
            });
        }

        if (!estadosPermitidos.includes(status)) {
            return res.status(400).json({
                erro: 'Estado do pagamento inválido.'
            });
        }

        // Confirmar que o pagamento existe
        const [pagamentos] = await db.query(`
            SELECT
                id,
                status
            FROM pagamentos
            WHERE id = ?
            LIMIT 1
        `, [id]);

        if (pagamentos.length === 0) {
            return res.status(404).json({
                erro: 'Pagamento não encontrado.'
            });
        }

        // Se já estiver no estado pretendido
        if (pagamentos[0].status === status) {
            return res.json({
                mensagem: 'O pagamento já se encontra nesse estado.'
            });
        }

        // Atualizar estado
        await db.query(`
            UPDATE pagamentos
            SET status = ?
            WHERE id = ?
        `, [
            status,
            id
        ]);

        res.json({
            mensagem: 'Estado do pagamento atualizado com sucesso.',
            id,
            status
        });

    } catch (erro) {
        console.error(
            'Erro ao atualizar estado do pagamento:',
            erro
        );

        res.status(500).json({
            erro: 'Erro ao atualizar o estado do pagamento.'
        });
    }
});


// ======================================================
// PUT - MARCAR PAGAMENTO COMO PAGO
// ======================================================
app.put('/api/pagamentos/:id/pago', async (req, res) => {
    try {
        const { id } = req.params;

        // Procurar pagamento
        const [pagamentos] = await db.query(`
            SELECT
                id,
                status
            FROM pagamentos
            WHERE id = ?
            LIMIT 1
        `, [id]);

        if (pagamentos.length === 0) {
            return res.status(404).json({
                erro: 'Pagamento não encontrado.'
            });
        }

        // Se já estiver pago
        if (pagamentos[0].status === 'pago') {
            return res.json({
                mensagem: 'O pagamento já está marcado como pago.'
            });
        }

        // Marcar como pago
        await db.query(`
            UPDATE pagamentos
            SET status = 'pago'
            WHERE id = ?
        `, [id]);

        res.json({
            mensagem: 'Pagamento marcado como pago com sucesso.',
            id,
            status: 'pago'
        });

    } catch (erro) {
        console.error(
            'Erro ao marcar pagamento como pago:',
            erro
        );

        res.status(500).json({
            erro: 'Erro ao marcar o pagamento como pago.'
        });
    }
});

// ======================================================
// INICIAR SERVIDOR
// ======================================================

app.listen(PORT, () => {
    console.log(`Servidor RESOLVA iniciado na porta ${PORT}`);
});