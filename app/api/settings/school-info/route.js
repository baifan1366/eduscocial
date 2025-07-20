import { NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth/serverAuth';
import { supabase } from '@/lib/supabase';

/**
 * 处理学校认证文件上传请求
 */
export async function POST(request) {
  try {
    // 验证用户会话
    const session = await getServerSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized access' }, { status: 401 });
    }

    // 解析请求体
    const body = await request.json();
    const { country, school, department, file } = body;

    // 验证必要字段
    if (!country || !school || !department || !file) {
      return NextResponse.json({ error: '请填写所有必填字段并上传证明文件' }, { status: 400 });
    }

    // 验证文件大小（以base64字符串长度作为粗略估计）
    const base64Length = file.data.length;
    const fileSizeInBytes = (base64Length - file.data.indexOf(',') - 1) * 0.75;
    
    if (fileSizeInBytes > 5 * 1024 * 1024) { // 5MB 限制
      return NextResponse.json({ error: '文件大小不能超过 5MB' }, { status: 400 });
    }
    
    // 验证文件类型
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: '只支持 JPG、PNG、GIF 和 PDF 格式' }, { status: 400 });
    }

    // 从 base64 数据中提取文件数据
    const base64Data = file.data.split(',')[1];
    const fileBuffer = Buffer.from(base64Data, 'base64');
    
    // 生成文件路径
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}.${fileExt}`;
    const filePath = `school-verification/${fileName}`;

    // 上传文件到存储
    const { error: uploadError } = await supabase.storage
      .from('files')
      .upload(filePath, fileBuffer, {
        contentType: file.type,
        cacheControl: '3600'
      });

    if (uploadError) {
      console.error('文件上传错误:', uploadError);
      return NextResponse.json({ error: '文件上传失败' }, { status: 500 });
    }

    // 返回成功响应
    return NextResponse.json({
      success: true,
      message: '文件上传成功',
      data: {
        country,
        school,
        department,
        verified: false,
        pendingVerification: true,
        documentPath: filePath,
        submittedAt: new Date().toISOString()
      }
    });
    
  } catch (error) {
    console.error('error:', error);
    return NextResponse.json({ error: 'School info upload failed' }, { status: 500 });
  }
} 