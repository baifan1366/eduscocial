import { NextResponse } from 'next/server';
import { supabase } from "@/lib/supabase";
import { getServerSession } from "@/lib/auth/serverAuth";

export async function GET(request, { params }) {
    const { id } = await params;

    // 获取用户会话
    const session = await getServerSession();

    if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const { business_credit, error } = await supabase
        .from("business_credits")
        .select('id, business_user_id, total_credits, used_credits, updated_at')
        .eq('business_user_id', id)
        .single();

        if (error) throw error;

        return NextResponse.json({ success: true, business_credit: business_credit });
    } catch (error) {
        console.error('error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function PATCH(request, { params }) {
    const { id } = await params;

    let data;
    try {
        const body = await request.json();
        data = body.data || body;
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

    try {
        // Get current credits first if we need to add to them
        let finalTotalCredits = data.totalCredits;
        let finalUsedCredits = data.usedCredits;

        // If data contains creditToAdd, we need to add to existing credits
        if (data.creditToAdd !== undefined) {
            const { data: currentCredits } = await supabase
                .from("business_credits")
                .select('total_credits, used_credits')
                .eq('business_user_id', id)
                .single();

            const currentTotalCredits = currentCredits?.total_credits || 0;
            const currentUsedCredits = currentCredits?.used_credits || 0;

            finalTotalCredits = currentTotalCredits + data.creditToAdd;
            finalUsedCredits = data.usedCredits !== undefined ? data.usedCredits : currentUsedCredits;
        }

        // Use upsert to handle cases where business_credits record doesn't exist yet
        const { data: business_credit, error } = await supabase
        .from("business_credits")
        .upsert({
            business_user_id: id,
            total_credits: finalTotalCredits,
            used_credits: finalUsedCredits,
            updated_at: new Date(),
        }, {
            onConflict: 'business_user_id',
            ignoreDuplicates: false,
        })
        .select('id, business_user_id, total_credits, used_credits, updated_at')
        .single();

        if (error) throw error;

        return NextResponse.json({ success: true, business_credit: business_credit });
    } catch (error) {
        console.error('error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}