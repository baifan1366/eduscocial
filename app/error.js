'use client'

import Image from 'next/image'
import Link from 'next/link'
import { RefreshCw, Home, ArrowLeft } from 'lucide-react'

export default function Error({ error, reset }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full text-center space-y-8">
        {/* Logo/Brand Image */}
        <div className="flex justify-center mb-8">
          <div className="relative w-32 h-32 rounded-full bg-white dark:bg-gray-800 shadow-lg p-4">
            <Image
              src="/slogan-removebg-preview.png"
              alt="EduSocial Logo"
              fill
              className="object-contain p-2"
            />
          </div>
        </div>

        {/* Error Icon with Animation */}
        <div className="relative">
          <div className="w-24 h-24 mx-auto bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mb-6">
            <div className="w-12 h-12 bg-red-500 rounded-full flex items-center justify-center animate-pulse">
              <span className="text-white text-2xl font-bold">!</span>
            </div>
          </div>
        </div>

        {/* Error Content */}
        <div className="space-y-4">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white">
            出错了
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-md mx-auto">
            抱歉，页面遇到了一些问题。请稍后再试或联系我们的支持团队。
          </p>
          
          {/* Error Details (Development) */}
          {process.env.NODE_ENV === 'development' && error && (
            <div className="mt-6 p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800 text-left">
              <h3 className="font-semibold text-red-800 dark:text-red-300 mb-2">错误详情:</h3>
              <pre className="text-sm text-red-700 dark:text-red-400 overflow-auto">
                {error.message}
              </pre>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-8">
          <button
            onClick={reset}
            className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-xl"
          >
            <RefreshCw className="w-5 h-5" />
            重试
          </button>
          
          <Link
            href="/"
            className="flex items-center gap-2 px-6 py-3 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-lg font-medium transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-xl"
          >
            <Home className="w-5 h-5" />
            返回首页
          </Link>
          
          <button
            onClick={() => window.history.back()}
            className="flex items-center gap-2 px-6 py-3 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg font-medium transition-all duration-200 transform hover:scale-105"
          >
            <ArrowLeft className="w-5 h-5" />
            返回上页
          </button>
        </div>

        {/* Decorative Elements */}
        <div className="absolute top-10 left-10 w-20 h-20 bg-blue-200 dark:bg-blue-800 rounded-full opacity-20 animate-bounce"></div>
        <div className="absolute bottom-10 right-10 w-16 h-16 bg-purple-200 dark:bg-purple-800 rounded-full opacity-20 animate-bounce" style={{animationDelay: '1s'}}></div>
        <div className="absolute top-1/2 left-5 w-12 h-12 bg-pink-200 dark:bg-pink-800 rounded-full opacity-20 animate-bounce" style={{animationDelay: '2s'}}></div>
      </div>
    </div>
  )
}