# 🚀 Webhook Engine & Dispatcher

> Motor de mensageria assíncrono e altamente resiliente desenvolvido em Node.js e Redis para garantia de entrega de webhooks e notificações, contando com **Exponential Backoff**, tratamento inteligente de falhas e **Dead Letter Queue (DLQ)**.

---

## 📌 Sumário
- [Visão Geral](#-visão-geral)
- [Arquitetura do Sistema](#-arquitetura-do-sistema)
- [Principais Funcionalidades](#-principais-funcionalidades)
- [Tecnologias Utilizadas](#-tecnologias-utilizadas)
- [Estrutura do Projeto](#-estrutura-do-projeto)
- [Como Executar o Projeto](#-como-executar-o-projeto)
- [Como Testar os Cenários de Resiliência](#-como-testar-os-cenários-de-resiliência)
- [Monitoramento Visual (Redis Insight)](#-monitoramento-visual-redis-insight)

---

## 📋 Visão Geral

Em arquiteturas orientadas a eventos e microserviços, enviar requisições HTTP síncronas para serviços externos durante o ciclo de vida de uma requisição pode causar lentidão ou perda de dados em casos de instabilidade do destino.

Este projeto resolve esse problema separando a recepção do evento da sua entrega final. Através de um motor de mensageria robusto, o sistema enfileira as notificações e tenta entregá-las utilizando estratégias de **retentativa com backoff exponencial**. Caso o destino permaneça indisponível após $N$ tentativas, o evento é movido com segurança para uma **Dead Letter Queue (DLQ)** para auditoria e reprocessamento posterior.

---

## 📐 Arquitetura do Sistema

[Cliente / API Produtora] ──(POST /events)──> [Express API]
│
(Enfileira Job)
▼
[Redis / BullMQ Queue]
│
(Worker consome)
▼
[Webhook Dispatcher]
│       │
(HTTP 2xx)   │       │ (HTTP 5xx / Timeout)
┌────────────────────┘       └────────────────────┐
▼                                                 ▼
[Entrega Sucesso]                             [Retry: Backoff Exponencial]
│
(Esgotou N tentativas?)
│
Sim ─────┴─────> [Dead Letter Queue (DLQ)]

---

## ⚙️ Principais Funcionalidades

- **Processamento Assíncrono (At-Least-Once Delivery)**: Desconecta a API do processamento de entrega, garantindo resposta imediata ao cliente (`202 Accepted`).
- **Retentativas com Backoff Exponencial**: Em falhas temporárias (HTTP 5xx, timeouts ou problemas de rede), o intervalo entre retentativas cresce exponencialmente (ex: 2s, 4s, 8s, 16s...), evitando sobrecarregar o servidor de destino (*Thundering Herd Effect*).
- **Dead Letter Queue (DLQ)**: Armazena eventos que falharam após todas as tentativas, mantendo o histórico de erros e payload intactos para auditoria ou reprocessamento manual.
- **Tratamento Inteligente de Status HTTP**:
  - **Erros 5xx / Timeout / Falha de Rede**: Trata como falha temporária e aciona o ciclo de retry.
  - **Erros 4xx (Client Error)**: Trata como falha irrecuperável (ex: payload inválido, URL inexistente) e cancela retentativas desnecessárias.
- **Servidor Mock Integrado**: Inclui rotas simuladas de sucesso, instabilidade intermitente e erro permanente para testes práticos de resiliência.

---

## 🛠️ Tecnologias Utilizadas

- **[Node.js](https://nodejs.org/)**: Runtime JavaScript assíncrono.
- **[Express](https://expressjs.com/)**: Framework para rotas HTTP de ingestão de eventos.
- **[BullMQ](https://docs.bullmq.io/) & [Redis](https://redis.io/)**: Gestão avançada de filas em memória, estratégias de retentativa e persistência.
- **[Axios](https://axios-http.com/)**: Cliente HTTP com suporte a cancelamento por timeout.
- **[Docker & Docker Compose](https://www.docker.com/)**: Containerização do banco Redis e da interface de monitoramento **Redis Insight**.

---

## 📂 Estrutura do Projeto

```text
webhook-engine/
├── docker-compose.yml          # Containerização do Redis e Redis Insight
├── package.json                # Scripts e dependências do projeto
├── README.md                   # Documentação
└── src/
    ├── config/
    │   └── redis.js            # Conexão centralizada do Redis
    ├── queues/
    │   ├── webhookQueue.js     # Configuração da fila principal de dispatching
    │   └── dlqQueue.js         # Configuração da Dead Letter Queue
    ├── http/
    │   ├── server.js           # Inicialização da API Express
    │   ├── routes.js           # Rotas HTTP (POST /events, GET /health)
    │   └── controllers/
    │       └── eventController.js  # Ingestão e validação de payloads
    ├── workers/
    │   ├── dispatcherWorker.js # Consumidor da fila principal e lógica de retry
    │   └── dlqWorker.js        # Consumidor de auditoria da Dead Letter Queue
    ├── services/
    │   └── httpDispatcher.js   # Disparador HTTP com controle de timeout
    └── mock/
        └── targetServer.js     # Servidor mock para testes de cenários reais


🚀 Como Executar o Projeto
Pré-requisitos
Node.js (v18+)

Docker Desktop ativo na máquina