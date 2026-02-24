'use server';

import {getAuth} from "@/lib/better-auth/auth";
import {inngest} from "@/lib/inngest/client";
import {headers} from "next/headers";

const getErrorMessage = (e: unknown): string => {
    if (e instanceof Error) return e.message;
    if (typeof e === 'string') return e;
    try {
        return JSON.stringify(e);
    } catch {
        return 'Unexpected error occurred';
    }
};

export const signUpWithEmail = async ({ email, password, fullName, country, investmentGoals, riskTolerance, preferredIndustry }: SignUpFormData) => {
    try{
        const auth = await getAuth();
        const response = await auth.api.signUpEmail({
            body: { email, password, name: fullName }
        })

        if(response) {
            await inngest.send({
                name: 'app/user.created',
                data: {
                    email,
                    name: fullName,
                    country,
                    investmentGoals,
                    riskTolerance,
                    preferredIndustry
                }
            })
        }

        return { success: true, data: response }
    }catch(e: unknown) {
        console.log('Sign up failed:', e);

        const message = getErrorMessage(e);

        return {
            success: false,
            error: `Sign up failed: ${message}`,
        };
    }
}

export const signOut = async () => {
    try {
        const auth = await getAuth();
        await auth.api.signOut({ headers: await headers() });
    }catch(e: unknown) {
        console.log('Sign out failed:', e)
        return { success: false, error: `Sign out failed: ${getErrorMessage(e)}`}
    }
}

export const signInWithEmail = async ({ email, password }: SignInFormData) => {
    try{
        const auth = await getAuth();
        const response = await auth.api.signInEmail({
            body: { email, password }
        })

        return { success: true, data: response }
    }catch(e: unknown) {
        console.log('Sign in failed:', e)
        return { success: false, error: `Sign in failed: ${getErrorMessage(e)}`}
    }
}