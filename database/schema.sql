USE resolva;

-- ============================================
-- RESOLVA - Base de Dados
-- ============================================

-- Utilizadores do sistema
CREATE TABLE utilizadores (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    telefone VARCHAR(20) NULL,
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('admin', 'tecnico', 'cliente') NOT NULL
);

-- Técnicos
CREATE TABLE tecnicos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    utilizador_id INT,
    disponivel BOOLEAN DEFAULT TRUE,
    avaliacao DECIMAL(2,1) DEFAULT 0.0,
    servicos_concluidos INT DEFAULT 0,

    FOREIGN KEY (utilizador_id)
        REFERENCES utilizadores(id)
        ON DELETE CASCADE
);

-- Categorias de serviços
CREATE TABLE categorias (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(100) NOT NULL UNIQUE,
    descricao VARCHAR(255)
);

-- Relação entre técnicos e especialidades
CREATE TABLE tecnico_especialidades (
    tecnico_id INT NOT NULL,
    categoria_id INT NOT NULL,

    PRIMARY KEY (tecnico_id, categoria_id),

    FOREIGN KEY (tecnico_id)
        REFERENCES tecnicos(id)
        ON DELETE CASCADE,

    FOREIGN KEY (categoria_id)
        REFERENCES categorias(id)
        ON DELETE CASCADE
);

-- Pedidos de serviço
CREATE TABLE pedidos (
    id VARCHAR(20) PRIMARY KEY,
    cliente_id INT NOT NULL,
    categoria_id INT NOT NULL,
    tecnico_id INT NULL,

    descricao TEXT NOT NULL,
    morada VARCHAR(255) NOT NULL,
    cidade VARCHAR(100) NOT NULL,
    data DATE NOT NULL,

    status ENUM(
        'pendente',
        'em_analise',
        'orcamento_enviado',
        'aceite',
        'agendado',
        'em_curso',
        'concluido',
        'cancelado'
    ) DEFAULT 'pendente',

    prioridade ENUM(
        'baixa',
        'media',
        'alta'
    ) DEFAULT 'media',

    FOREIGN KEY (cliente_id)
        REFERENCES utilizadores(id),

    FOREIGN KEY (categoria_id)
        REFERENCES categorias(id),

    FOREIGN KEY (tecnico_id)
        REFERENCES tecnicos(id)
);


-- ============================================
-- HISTÓRICO DOS PEDIDOS
-- ============================================

CREATE TABLE historico_pedidos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    pedido_id VARCHAR(20) NOT NULL,
    tipo ENUM('cliente', 'admin', 'tecnico') NOT NULL,
    texto TEXT NOT NULL,
    data DATETIME NOT NULL,

    FOREIGN KEY (pedido_id)
        REFERENCES pedidos(id)
        ON DELETE CASCADE
);


-- ============================================
-- FOTOS DOS PEDIDOS
-- ============================================

CREATE TABLE fotos_pedidos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    pedido_id VARCHAR(20) NOT NULL,
    caminho VARCHAR(255) NOT NULL,

    FOREIGN KEY (pedido_id)
        REFERENCES pedidos(id)
        ON DELETE CASCADE
);


-- ============================================
-- ORÇAMENTOS
-- ============================================

CREATE TABLE orcamentos (
    id VARCHAR(20) PRIMARY KEY,
    pedido_id VARCHAR(20) NOT NULL,
    valor DECIMAL(10,2) NOT NULL,
    validade DATE NOT NULL,
    status ENUM('pendente', 'aceite', 'rejeitado') DEFAULT 'pendente',

    FOREIGN KEY (pedido_id)
        REFERENCES pedidos(id)
        ON DELETE CASCADE
);


-- ============================================
-- ITENS DOS ORÇAMENTOS
-- ============================================

CREATE TABLE itens_orcamento (
    id INT AUTO_INCREMENT PRIMARY KEY,
    orcamento_id VARCHAR(20) NOT NULL,
    descricao VARCHAR(255) NOT NULL,
    valor DECIMAL(10,2) NOT NULL,

    FOREIGN KEY (orcamento_id)
        REFERENCES orcamentos(id)
        ON DELETE CASCADE
);


-- ============================================
-- AGENDAMENTOS
-- ============================================

CREATE TABLE agendamentos (
    id VARCHAR(20) PRIMARY KEY,
    pedido_id VARCHAR(20) NOT NULL,
    tecnico_id INT NOT NULL,
    data DATE NOT NULL,
    hora TIME NOT NULL,
    duracao VARCHAR(20),
    status ENUM(
        'confirmado',
        'em_curso',
        'concluido',
        'cancelado'
    ) DEFAULT 'confirmado',

    FOREIGN KEY (pedido_id)
        REFERENCES pedidos(id)
        ON DELETE CASCADE,

    FOREIGN KEY (tecnico_id)
        REFERENCES tecnicos(id)
);


-- ============================================
-- PAGAMENTOS
-- ============================================

CREATE TABLE pagamentos (
    id VARCHAR(20) PRIMARY KEY,
    pedido_id VARCHAR(20) NOT NULL,
    valor DECIMAL(10,2) NOT NULL,
    data DATE,
    metodo VARCHAR(50),
    status ENUM(
        'pendente',
        'pago',
        'falhado'
    ) DEFAULT 'pendente',

    FOREIGN KEY (pedido_id)
        REFERENCES pedidos(id)
        ON DELETE CASCADE
);