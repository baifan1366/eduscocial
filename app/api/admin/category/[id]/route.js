import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { getServerSession } from "@/lib/auth/serverAuth";

/**
 * 更新分类
 * PUT /api/admin/category/:id
 */
export async function PUT(request, { params }) {
    const { id } = await params;
    const { user } = await getServerSession();

    if (!user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const data = await request.json();
        const { name, description, color, icon } = data;

        // 检查分类是否存在
        const { data: existingCategory, error: fetchError } = await supabase
            .from("board_categories")
            .select("*")
            .eq("id", id)
            .single();

        if (fetchError) {
            return NextResponse.json({ error: "Category not found" }, { status: 404 });
        }

        // 更新分类
        const { data: updatedCategory, error } = await supabase
            .from("board_categories")
            .update({
                name,
                description,
                color,
                icon,
                updated_at: new Date(),
            })
            .eq("id", id)
            .select('id, name, description, color, icon, parent_id, is_active')
            .single();

        if (error) throw error;

        return NextResponse.json({ success: true, category: updatedCategory });
    } catch (error) {
        console.error('更新分类失败:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

/**
 * 删除分类
 * DELETE /api/admin/category/:id
 */
export async function DELETE(request, { params }) {
    const { id } = await params;
    const { user } = await getServerSession();

    if (!user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        // 检查分类是否存在
        const { data: existingCategory, error: fetchError } = await supabase
            .from("board_categories")
            .select("*")
            .eq("id", id)
            .single();

        if (fetchError) {
            return NextResponse.json({ error: "Category not found" }, { status: 404 });
        }

        // 检查是否有子分类
        const { data: children, error: childrenError } = await supabase
            .from("board_categories")
            .select("id")
            .eq("parent_id", id);

        if (childrenError) throw childrenError;

        if (children && children.length > 0) {
            return NextResponse.json({ 
                error: "Cannot delete category with subcategories" 
            }, { status: 400 });
        }

        // 删除分类
        const { error } = await supabase
            .from("board_categories")
            .delete()
            .eq("id", id);

        if (error) throw error;

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('删除分类失败:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
} 