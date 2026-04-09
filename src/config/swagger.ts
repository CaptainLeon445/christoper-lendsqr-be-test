import swaggerJsdoc from "swagger-jsdoc";

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Demo Credit Wallet Service API",
      version: "1.0.0",
      description:
        "MVP wallet service for the Demo Credit lending app. Supports user registration, authentication, wallet funding, transfers, and withdrawals.",
    },
    servers: [
      {
        url: "/api/v1",
        description: "API v1",
      },
    ],
    components: {
      securitySchemes: {
        BearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
          description: "JWT token obtained from /auth/login or /auth/register",
        },
      },
      schemas: {
        ApiResponse: {
          type: "object",
          properties: {
            success: { type: "boolean" },
            message: { type: "string" },
            data: {},
          },
          required: ["success", "message"],
        },
        ErrorResponse: {
          type: "object",
          properties: {
            success: { type: "boolean", example: false },
            message: { type: "string" },
          },
          required: ["success", "message"],
        },
        User: {
          type: "object",
          properties: {
            id: { type: "string", format: "uuid" },
            email: { type: "string", format: "email" },
            firstName: { type: "string" },
            lastName: { type: "string" },
            createdAt: { type: "string", format: "date-time" },
            updatedAt: { type: "string", format: "date-time" },
          },
        },
        Wallet: {
          type: "object",
          properties: {
            id: { type: "string", format: "uuid" },
            userId: { type: "string", format: "uuid" },
            balance: { type: "number", format: "double", example: 5000.0 },
            createdAt: { type: "string", format: "date-time" },
            updatedAt: { type: "string", format: "date-time" },
          },
        },
        Transaction: {
          type: "object",
          properties: {
            id: { type: "string", format: "uuid" },
            walletId: { type: "string", format: "uuid" },
            type: {
              type: "string",
              enum: ["FUNDING", "TRANSFER", "WITHDRAWAL"],
            },
            amount: { type: "number", format: "double", example: 1000.0 },
            status: {
              type: "string",
              enum: ["PENDING", "COMPLETED", "FAILED"],
            },
            reference: { type: "string" },
            narration: { type: "string" },
            counterpartyWalletId: {
              type: "string",
              format: "uuid",
              nullable: true,
            },
            createdAt: { type: "string", format: "date-time" },
            updatedAt: { type: "string", format: "date-time" },
          },
        },
        AuthResult: {
          type: "object",
          properties: {
            user: { $ref: "#/components/schemas/User" },
            token: {
              type: "string",
              description: "JWT bearer token",
              example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
            },
          },
        },
      },
    },
    tags: [
      { name: "Auth", description: "Registration and login" },
      { name: "Wallet", description: "Wallet operations (requires authentication)" },
      { name: "Users", description: "User profile (requires authentication)" },
    ],
    paths: {
      "/auth/register": {
        post: {
          tags: ["Auth"],
          summary: "Register a new user",
          description:
            "Creates a new user account and wallet. The email is checked against the Lendsqr Adjutor Karma blacklist; blacklisted identities are rejected.",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["email", "firstName", "lastName", "password"],
                  properties: {
                    email: {
                      type: "string",
                      format: "email",
                      example: "jane.doe@example.com",
                    },
                    firstName: {
                      type: "string",
                      minLength: 2,
                      example: "Jane",
                    },
                    lastName: {
                      type: "string",
                      minLength: 2,
                      example: "Doe",
                    },
                    password: {
                      type: "string",
                      minLength: 6,
                      format: "password",
                      example: "s3cr3t!",
                    },
                  },
                },
              },
            },
          },
          responses: {
            "201": {
              description: "Account created successfully",
              content: {
                "application/json": {
                  schema: {
                    allOf: [
                      { $ref: "#/components/schemas/ApiResponse" },
                      {
                        type: "object",
                        properties: {
                          data: { $ref: "#/components/schemas/AuthResult" },
                        },
                      },
                    ],
                  },
                },
              },
            },
            "400": {
              description: "Validation error (missing or invalid fields)",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ErrorResponse" },
                },
              },
            },
            "403": {
              description: "Email is blacklisted by Adjutor Karma",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ErrorResponse" },
                },
              },
            },
            "409": {
              description: "Email already registered",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ErrorResponse" },
                },
              },
            },
          },
        },
      },
      "/auth/login": {
        post: {
          tags: ["Auth"],
          summary: "Log in",
          description: "Authenticates a user and returns a JWT token.",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["email", "password"],
                  properties: {
                    email: {
                      type: "string",
                      format: "email",
                      example: "jane.doe@example.com",
                    },
                    password: {
                      type: "string",
                      format: "password",
                      example: "s3cr3t!",
                    },
                  },
                },
              },
            },
          },
          responses: {
            "200": {
              description: "Login successful",
              content: {
                "application/json": {
                  schema: {
                    allOf: [
                      { $ref: "#/components/schemas/ApiResponse" },
                      {
                        type: "object",
                        properties: {
                          data: { $ref: "#/components/schemas/AuthResult" },
                        },
                      },
                    ],
                  },
                },
              },
            },
            "400": {
              description: "Validation error",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ErrorResponse" },
                },
              },
            },
            "401": {
              description: "Invalid credentials",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ErrorResponse" },
                },
              },
            },
          },
        },
      },
      "/wallet/balance": {
        get: {
          tags: ["Wallet"],
          summary: "Get wallet balance",
          description: "Returns the authenticated user's wallet details including current balance.",
          security: [{ BearerAuth: [] }],
          responses: {
            "200": {
              description: "Wallet balance retrieved",
              content: {
                "application/json": {
                  schema: {
                    allOf: [
                      { $ref: "#/components/schemas/ApiResponse" },
                      {
                        type: "object",
                        properties: {
                          data: { $ref: "#/components/schemas/Wallet" },
                        },
                      },
                    ],
                  },
                },
              },
            },
            "401": {
              description: "Missing or invalid JWT token",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ErrorResponse" },
                },
              },
            },
            "404": {
              description: "Wallet not found",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ErrorResponse" },
                },
              },
            },
          },
        },
      },
      "/wallet/fund": {
        post: {
          tags: ["Wallet"],
          summary: "Fund wallet",
          description: "Credits the authenticated user's wallet with the specified amount.",
          security: [{ BearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["amount"],
                  properties: {
                    amount: {
                      type: "number",
                      minimum: 0.01,
                      description: "Amount to credit (must be greater than zero)",
                      example: 5000,
                    },
                  },
                },
              },
            },
          },
          responses: {
            "201": {
              description: "Wallet funded successfully",
              content: {
                "application/json": {
                  schema: {
                    allOf: [
                      { $ref: "#/components/schemas/ApiResponse" },
                      {
                        type: "object",
                        properties: {
                          data: { $ref: "#/components/schemas/Transaction" },
                        },
                      },
                    ],
                  },
                },
              },
            },
            "400": {
              description: "Validation error (e.g. amount ≤ 0)",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ErrorResponse" },
                },
              },
            },
            "401": {
              description: "Unauthorized",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ErrorResponse" },
                },
              },
            },
          },
        },
      },
      "/wallet/transfer": {
        post: {
          tags: ["Wallet"],
          summary: "Transfer funds",
          description:
            "Transfers funds from the authenticated user's wallet to another user identified by email.",
          security: [{ BearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["recipientEmail", "amount"],
                  properties: {
                    recipientEmail: {
                      type: "string",
                      format: "email",
                      description: "Email address of the transfer recipient",
                      example: "john.smith@example.com",
                    },
                    amount: {
                      type: "number",
                      minimum: 0.01,
                      description: "Amount to transfer (must be greater than zero)",
                      example: 1000,
                    },
                    narration: {
                      type: "string",
                      description: "Optional transfer description",
                      example: "For lunch",
                    },
                  },
                },
              },
            },
          },
          responses: {
            "201": {
              description: "Transfer successful",
              content: {
                "application/json": {
                  schema: {
                    allOf: [
                      { $ref: "#/components/schemas/ApiResponse" },
                      {
                        type: "object",
                        properties: {
                          data: { $ref: "#/components/schemas/Transaction" },
                        },
                      },
                    ],
                  },
                },
              },
            },
            "400": {
              description: "Validation error or insufficient balance",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ErrorResponse" },
                },
              },
            },
            "401": {
              description: "Unauthorized",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ErrorResponse" },
                },
              },
            },
            "404": {
              description: "Recipient not found",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ErrorResponse" },
                },
              },
            },
          },
        },
      },
      "/wallet/withdraw": {
        post: {
          tags: ["Wallet"],
          summary: "Withdraw funds",
          description:
            "Debits the authenticated user's wallet by the specified amount (simulates a bank withdrawal).",
          security: [{ BearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["amount"],
                  properties: {
                    amount: {
                      type: "number",
                      minimum: 0.01,
                      description: "Amount to withdraw (must be greater than zero)",
                      example: 2000,
                    },
                  },
                },
              },
            },
          },
          responses: {
            "201": {
              description: "Withdrawal successful",
              content: {
                "application/json": {
                  schema: {
                    allOf: [
                      { $ref: "#/components/schemas/ApiResponse" },
                      {
                        type: "object",
                        properties: {
                          data: { $ref: "#/components/schemas/Transaction" },
                        },
                      },
                    ],
                  },
                },
              },
            },
            "400": {
              description: "Validation error or insufficient balance",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ErrorResponse" },
                },
              },
            },
            "401": {
              description: "Unauthorized",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ErrorResponse" },
                },
              },
            },
          },
        },
      },
      "/wallet/transactions": {
        get: {
          tags: ["Wallet"],
          summary: "Get transaction history",
          description: "Returns a list of all transactions for the authenticated user's wallet.",
          security: [{ BearerAuth: [] }],
          responses: {
            "200": {
              description: "Transactions retrieved",
              content: {
                "application/json": {
                  schema: {
                    allOf: [
                      { $ref: "#/components/schemas/ApiResponse" },
                      {
                        type: "object",
                        properties: {
                          data: {
                            type: "array",
                            items: { $ref: "#/components/schemas/Transaction" },
                          },
                        },
                      },
                    ],
                  },
                },
              },
            },
            "401": {
              description: "Unauthorized",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ErrorResponse" },
                },
              },
            },
          },
        },
      },
      "/users/profile": {
        get: {
          tags: ["Users"],
          summary: "Get user profile",
          description: "Returns the authenticated user's profile information (password excluded).",
          security: [{ BearerAuth: [] }],
          responses: {
            "200": {
              description: "Profile retrieved successfully",
              content: {
                "application/json": {
                  schema: {
                    allOf: [
                      { $ref: "#/components/schemas/ApiResponse" },
                      {
                        type: "object",
                        properties: {
                          data: { $ref: "#/components/schemas/User" },
                        },
                      },
                    ],
                  },
                },
              },
            },
            "401": {
              description: "Unauthorized",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ErrorResponse" },
                },
              },
            },
            "404": {
              description: "User not found",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ErrorResponse" },
                },
              },
            },
          },
        },
      },
    },
  },
  apis: [],
};

export const swaggerSpec = swaggerJsdoc(options);
