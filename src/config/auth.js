import { betterAuth } from "better-auth";
import { mongodbAdapter } from "better-auth/adapters/mongodb";
import { bearer } from "better-auth/plugins";
import { MongoConnectDB } from "./database.js";

const dbClient = MongoConnectDB();

export const auth = betterAuth({
    database: mongodbAdapter(dbClient),
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