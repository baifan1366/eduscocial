import { NextResponse } from 'next/server';
import { supabase } from "@/lib/supabase";
import { getServerSession } from "@/lib/auth/serverAuth";

export async function GET(request, { params }) {
    const { id } = params;

    // 获取用户会话
    const session = await getServerSession();

    if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const { data: invoices, error } = await supabase
        .from("invoices")
        .select(`
            id, order_id, invoice_number, business_name, business_tax_id,
            billing_address, pdf_url, issued_at, created_at,
            credit_orders!inner(business_user_id)
        `)
        .eq('credit_orders.business_user_id', id)
        .order('created_at', { ascending: false });

        if (error) throw error;

        return NextResponse.json({ success: true, invoices: invoices || [] });
    } catch (error) {
        console.error('error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}