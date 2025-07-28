import { NextResponse } from 'next/server';
import { supabase } from "@/lib/supabase";
import { getServerSession } from "@/lib/auth/serverAuth";

export async function GET(request, { params }) {
    const { id } = params;
    const { data } = await request.json();
    
    // 获取用户会话
    const session = await getServerSession();

    if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const { user } = session;

    try {
        const { invoices, error } = await supabase
        .from("invoices")
        .select('id, order_id, invoice_number, business_name, business_tax_id, billing_address, pdf_url, issued_at, created_at')
        .eq('business_user_id', id)
        .single();

        if (error) throw error;

        return NextResponse.json({ success: true, invoices: invoices });
    } catch (error) {
        console.error('error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}