import { betterAuth } from "better-auth";
import { mongodbAdapter } from "better-auth/adapters/mongodb";
import { bearer } from "better-auth/plugins";
import { MongoConnectDB } from "./database.js";

const dbClient = await MongoConnectDB();

export const auth = betterAuth({
    database: mongodbAdapter(dbClient),
    basePath: "/api/v1/auth",
    emailAndPassword: {
        enabled: true,
        autoSignIn: true
    },
    user: {
        additionalFields: {
            role: {
                type: "string",
                defaultValue: "Customer",
                required: false
            },
            phone: {
                type: "string",
                required: false
            }
        }
    },
    plugins: [
        bearer()
    ]
});