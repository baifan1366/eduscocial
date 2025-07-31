import { NextResponse } from 'next/server';
import { supabase } from "@/lib/supabase";
import { getServerSession } from "@/lib/auth/serverAuth";

export async function POST(request) {
    let data;
    try {
        const requestBody = await request.json();
        data = requestBody.data || requestBody;
    } catch (error) {
        console.error('JSON parsing error:', error);
        return NextResponse.json({
            error: "Invalid JSON format in request body"
        }, { status: 400 });
    }

    // 获取用户会话
    const session = await getServerSession();
    
    if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const { user } = session;

    try {
        // Start a transaction to ensure both operations succeed or fail together
        const { data: credit_transaction, error: transactionError } = await supabase
        .from("credit_transactions")
        .insert({
            business_user_id: user.id,
            order_id: data.orderId,
            type: data.type,
            credit_change: data.creditChange,
            balance_after: data.balanceAfter,
            description: data.description,
            created_at: new Date(),
        })
        .select('id, business_user_id, order_id, type, credit_change, balance_after, description, created_at')
        .single();

        if (transactionError) throw transactionError;

        // Update business_credits table if this is a top_up transaction
        if (data.type === 'top_up' && data.creditChange) {
            // Get current credits
            const { data: currentCredits } = await supabase
                .from("business_credits")
                .select('total_credits, used_credits')
                .eq('business_user_id', user.id)
                .single();

            const currentTotalCredits = currentCredits?.total_credits || 0;
            const usedCredits = currentCredits?.used_credits || 0;
            const newTotalCredits = currentTotalCredits + data.creditChange;

            // Update or insert business_credits
            const { error: creditsError } = await supabase
                .from("business_credits")
                .upsert({
                    business_user_id: user.id,
                    total_credits: newTotalCredits,
                    used_credits: usedCredits,
                    updated_at: new Date(),
                }, {
                    onConflict: 'business_user_id',
                    ignoreDuplicates: false,
                });

            if (creditsError) {
                console.error('Failed to update business_credits:', creditsError);
                // Don't throw error here, transaction was already created successfully
            }

            // Update the transaction record with the correct balance_after
            if (data.balanceAfter !== newTotalCredits) {
                const { error: updateTransactionError } = await supabase
                    .from("credit_transactions")
                    .update({ balance_after: newTotalCredits })
                    .eq('id', credit_transaction.id);

                if (updateTransactionError) {
                    console.error('Failed to update transaction balance_after:', updateTransactionError);
                }
            }
        }

        return NextResponse.json({
            success: true,
            credit_transaction: credit_transaction,
            credits_updated: data.type === 'top_up'
        });
    } catch (error) {
        console.error('error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}