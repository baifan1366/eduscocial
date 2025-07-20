'use client';

import Image from 'next/image'
import Link from 'next/link'
import { Home, Search, ArrowLeft, BookOpen } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-cyan-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center p-4">
      <div className="max-w-4xl w-full text-center space-y-8">
        {/* Logo/Brand Section */}
        <div className="flex justify-center mb-8">
          <div className="relative w-40 h-40 rounded-2xl bg-white dark:bg-gray-800 shadow-2xl p-6 transform rotate-3 hover:rotate-0 transition-transform duration-300">
            <Image
              src="/slogan-removebg-preview.png"
              alt="EduSocial Logo"
              fill
              className="object-contain p-2"
            />
          </div>
        </div>

        {/* 404 Visual */}
        <div className="relative mb-8">
          <div className="text-8xl md:text-9xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400">
            404
          </div>
          <div className="absolute inset-0 text-8xl md:text-9xl font-black text-blue-100 dark:text-blue-900 transform translate-x-2 translate-y-2 -z-10">
            404
          </div>
        </div>

        {/* Content */}
        <div className="space-y-6">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white">
            页面未找到
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto leading-relaxed">
            抱歉，您访问的页面不存在或已被移动。让我们帮您找到正确的方向，继续您的学习之旅。
          </p>
        </div>

        {/* Search Suggestion */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-xl border border-gray-100 dark:border-gray-700 max-w-md mx-auto">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
              <Search className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <h3 className="font-semibold text-gray-900 dark:text-white">寻找内容？</h3>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            尝试搜索您感兴趣的课程、文章或用户
          </p>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="搜索..."
              className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors">
              搜索
            </button>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-8">
          <Link
            href="/"
            className="flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-xl font-medium transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-xl"
          >
            <Home className="w-5 h-5" />
            返回首页
          </Link>
          
          <Link
            href="/courses"
            className="flex items-center gap-2 px-8 py-4 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-xl font-medium transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-xl"
          >
            <BookOpen className="w-5 h-5" />
            浏览课程
          </Link>
          
          <button
            onClick={() => window.history.back()}
            className="flex items-center gap-2 px-8 py-4 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-xl font-medium transition-all duration-200 transform hover:scale-105"
          >
            <ArrowLeft className="w-5 h-5" />
            返回上页
          </button>
        </div>

        {/* Popular Links */}
        <div className="pt-8 border-t border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">热门页面</h3>
          <div className="flex flex-wrap justify-center gap-3">
            {[
              { name: '课程中心', href: '/courses' },
              { name: '社区讨论', href: '/community' },
              { name: '我的学习', href: '/my-learning' },
              { name: '帮助中心', href: '/help' }
            ].map((link) => (
              <Link
                key={link.name}
                href={link.href}
                className="px-4 py-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-medium transition-colors"
              >
                {link.name}
              </Link>
            ))}
          </div>
        </div>

        {/* Floating Decorations */}
        <div className="fixed top-20 left-10 w-6 h-6 bg-blue-300 dark:bg-blue-700 rounded-full opacity-30 animate-ping"></div>
        <div className="fixed top-40 right-20 w-4 h-4 bg-purple-300 dark:bg-purple-700 rounded-full opacity-30 animate-ping" style={{animationDelay: '1s'}}></div>
        <div className="fixed bottom-32 left-16 w-8 h-8 bg-cyan-300 dark:bg-cyan-700 rounded-full opacity-30 animate-ping" style={{animationDelay: '2s'}}></div>
        <div className="fixed bottom-20 right-10 w-5 h-5 bg-pink-300 dark:bg-pink-700 rounded-full opacity-30 animate-ping" style={{animationDelay: '3s'}}></div>
      </div>
    </div>
  )
}