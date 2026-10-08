USE resolva;

-- =====================================================
-- DADOS FICTÍCIOS PARA TESTES
-- Nunca utilizar dados pessoais reais
-- =====================================================


-- UTILIZADORES

INSERT INTO utilizadores (nome, email, password_hash, role) VALUES
('Administrador', 'admin@resolva.pt', 'teste123', 'admin'),
('Ana Ferreira', 'ana@resolva.pt', 'teste123', 'cliente'),
('João Rodrigues', 'joao@resolva.pt', 'teste123', 'cliente'),
('Marta Costa', 'marta@resolva.pt', 'teste123', 'cliente'),
('Pedro Alves', 'pedro@resolva.pt', 'teste123', 'cliente'),
('Sofia Lima', 'sofia@resolva.pt', 'teste123', 'cliente'),
('Rui Monteiro', 'rui.monteiro@resolva.pt', 'teste123', 'cliente'),
('Carlos Mendes', 'carlos@resolva.pt', 'teste123', 'tecnico'),
('Rui Santos', 'rui.santos@resolva.pt', 'teste123', 'tecnico'),
('Tiago Pires', 'tiago@resolva.pt', 'teste123', 'tecnico'),
('Luís Oliveira', 'luis@resolva.pt', 'teste123', 'tecnico'),
('Filipe Sousa', 'filipe@resolva.pt', 'teste123', 'tecnico');


-- TÉCNICOS

INSERT INTO tecnicos
(utilizador_id, disponivel, avaliacao, servicos_concluidos)
VALUES
(8, TRUE, 4.9, 142),
(9, TRUE, 4.7, 98),
(10, FALSE, 4.8, 215),
(11, TRUE, 4.6, 67),
(12, TRUE, 4.5, 83);


-- CATEGORIAS

INSERT INTO categorias (nome, descricao) VALUES
('Canalização', 'Serviços de canalização'),
('Eletricidade', 'Serviços elétricos'),
('Climatização', 'Sistemas de climatização'),
('Refrigeração', 'Reparação de equipamentos de refrigeração'),
('Carpintaria', 'Serviços de carpintaria'),
('Montagem', 'Serviços de montagem'),
('AVAC', 'Aquecimento, ventilação e ar condicionado');


-- ESPECIALIDADES DOS TÉCNICOS

INSERT INTO tecnico_especialidades
(tecnico_id, categoria_id)
VALUES
(1, 2),
(1, 7),
(2, 2),
(3, 1),
(4, 5),
(4, 6),
(5, 3),
(5, 1);


-- PEDIDOS

INSERT INTO pedidos
(id, cliente_id, categoria_id, tecnico_id, descricao, morada, cidade, data, status, prioridade)
VALUES
('P-2401', 2, 1, 1,
 'Fuga de água na cozinha perto do lavatório',
 'Rua das Flores 12', 'Lisboa', '2026-09-15',
 'agendado', 'alta'),

('P-2402', 3, 2, 2,
 'Tomadas sem corrente no quarto principal',
 'Av. da Liberdade 45', 'Lisboa', '2026-09-16',
 'orcamento_enviado', 'media'),

('P-2403', 4, 3, NULL,
 'Instalação e ajuste de sistema de climatização',
 'Rua do Ouro 78', 'Porto', '2026-09-17',
 'em_analise', 'baixa'),

('P-2404', 5, 4, NULL,
 'Frigorífico não arrefece corretamente',
 'Rua Augusta 23', 'Lisboa', '2026-09-17',
 'pendente', 'alta'),

('P-2405', 6, 2, 1,
 'Instalação de quadro elétrico novo',
 'Rua de Santa Catarina 56', 'Porto', '2026-09-18',
 'concluido', 'media'),

('P-2406', 7, 1, 3,
 'Entupimento no WC',
 'Travessa da Paz 9', 'Braga', '2026-09-18',
 'em_curso', 'alta');


-- HISTÓRICO

INSERT INTO historico_pedidos
(pedido_id, tipo, texto, data)
VALUES
('P-2401', 'cliente', 'Pedido enviado com foto do problema.', '2026-09-15 09:00:00'),
('P-2401', 'admin', 'Pedido validado e agendado com Carlos Mendes.', '2026-09-15 11:30:00'),
('P-2402', 'cliente', 'Solicitação registada com descrição detalhada.', '2026-09-16 08:00:00'),
('P-2403', 'admin', 'Pedido em análise para confirmação de orçamento.', '2026-09-17 10:00:00'),
('P-2404', 'cliente', 'Pedido novo recebido pelo cliente.', '2026-09-17 09:15:00'),
('P-2405', 'tecnico', 'Serviço concluído com inspeção final.', '2026-09-18 16:00:00'),
('P-2406', 'tecnico', 'Técnico atribuído e trabalho em curso.', '2026-09-18 13:45:00');


-- ORÇAMENTOS

INSERT INTO orcamentos
(id, pedido_id, valor, validade, status)
VALUES
('ORC-001', 'P-2402', 185.00, '2026-09-25', 'pendente'),
('ORC-002', 'P-2403', 1240.00, '2026-09-28', 'aceite'),
('ORC-003', 'P-2401', 320.00, '2026-09-22', 'aceite');


-- ITENS DOS ORÇAMENTOS

INSERT INTO itens_orcamento
(orcamento_id, descricao, valor)
VALUES
('ORC-001', 'Mão de obra (2h)', 120.00),
('ORC-001', 'Material (tomadas + cabo)', 65.00),

('ORC-002', 'Mão de obra (4 dias)', 800.00),
('ORC-002', 'Materiais', 440.00),

('ORC-003', 'Mão de obra (3h)', 180.00),
('ORC-003', 'Peças e material', 140.00);


-- AGENDAMENTOS

INSERT INTO agendamentos
(id, pedido_id, tecnico_id, data, hora, duracao, status)
VALUES
('AG-001', 'P-2401', 1, '2026-09-20', '09:00:00', '3h', 'confirmado'),
('AG-002', 'P-2406', 3, '2026-09-18', '14:30:00', '2h', 'em_curso'),
('AG-003', 'P-2405', 1, '2026-09-16', '08:00:00', '4h', 'concluido'),
('AG-004', 'P-2402', 2, '2026-09-22', '10:00:00', '2h', 'confirmado');


-- PAGAMENTOS

INSERT INTO pagamentos
(id, pedido_id, valor, data, metodo, status)
VALUES
('PAG-001', 'P-2403', 1240.00, '2026-09-17', 'Transferência', 'pago'),
('PAG-002', 'P-2401', 320.00, '2026-09-20', 'Multibanco', 'pendente'),
('PAG-003', 'P-2405', 580.00, '2026-09-16', 'MB Way', 'pago'),
('PAG-004', 'P-2402', 185.00, '2026-09-22', 'Multibanco', 'pendente'),
('PAG-005', 'P-2406', 95.00, '2026-09-18', 'MB Way', 'pago');