import { NextResponse } from 'next/server';
import { supabase } from "@/lib/supabase";
import { getServerSession } from "@/lib/auth/serverAuth";

export async function POST(request) {
    const { data } = await request.json();
    
    // 获取用户会话
    const session = await getServerSession();
    
    if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const { user } = session;

    try {
        const { invoice, error } = await supabase
        .from("invoices")
        .insert({
            order_id: data.orderId,
            invoice_number: data.invoiceNumber,
            business_name: data.businessName,
            business_tax_id: data.businessTaxId,
            billing_address: data.billingAddress,
            pdf_url: data.pdfUrl,
            issued_at: data.issuedAt,
            created_at: new Date(),
        })
        .select('id, order_id, invoice_number, business_name, business_tax_id, billing_address, pdf_url, issued_at, created_at')
        .single();
        
        if (error) throw error;
        
        return NextResponse.json({ success: true, invoice: invoice });
    } catch (error) {
        console.error('error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}