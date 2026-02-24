'use server';

import {getAuth} from "@/lib/better-auth/auth";
import {inngest} from "@/lib/inngest/client";
import {headers} from "next/headers";

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
    }catch(e: any) {
        console.log('Sign up failed:', e);

        const message =
            e instanceof Error ? e.message : 'Unexpected error occurred';

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
    }catch(e: any) {
        console.log('Sign out failed:', e)
        return { success: false, error: 'Sign out failed'}
    }
}

export const signInWithEmail = async ({ email, password }: SignInFormData) => {
    try{
        const auth = await getAuth();
        const response = await auth.api.signInEmail({
            body: { email, password }
        })

        return { success: true, data: response }
    }catch(e: any) {
        console.log('Sign in failed:', e)
        return { success: false, error: `Sign in failed: ${e.message}`}
    }
}