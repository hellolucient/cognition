"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { BookmarkletModal } from "@/components/bookmarklet/bookmarklet-modal";

export default function InstallPage() {
  const [showBookmarkletModal, setShowBookmarkletModal] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* Static background similar to home page */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50" />
      
      {/* Main content */}
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-4 py-8">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          {/* Logo */}
          <div className="flex justify-center">
            <img src="/vanwinkle_logo.png" alt="vanwinkle" className="h-20 w-auto" />
          </div>

          {/* Hero section */}
          <div className="space-y-6">
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900">
              Copy Complete AI Conversations
            </h1>
            <p className="text-xl md:text-2xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              Get started in 10 seconds - instantly copy complete conversations from ChatGPT, Claude, Perplexity, Grok, Gemini, Copilot, and more!
            </p>
            <div className="flex flex-wrap justify-center gap-4 text-sm text-gray-500">
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                Free to use
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                No registration required
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
                Works on all platforms
              </span>
            </div>
          </div>

          {/* Installation CTA */}
          <div className="bg-white/80 backdrop-blur-sm border-2 border-blue-200 rounded-2xl p-8 shadow-xl">
            <div className="space-y-6">
              <div className="text-center">
                <h2 className="text-2xl font-bold text-blue-900 mb-2">
                  Ready to Copy? Install in 10 Seconds
                </h2>
                <p className="text-gray-700 text-lg">
                  Drag the button below to your bookmarks bar. Then use it on any AI conversation to instantly copy the complete chat.
                </p>
              </div>
              
              <div className="flex justify-center">
                <Button 
                  onClick={() => setShowBookmarkletModal(true)} 
                  size="lg"
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-12 py-6 text-xl font-bold shadow-2xl hover:shadow-3xl transition-all duration-300 transform hover:scale-105"
                >
                  🚀 Install Bookmarklet Now
                </Button>
              </div>
              
              <div className="text-center text-sm text-gray-600">
                <p>✨ Works on Chrome, Firefox, Safari, and Edge</p>
              </div>
            </div>
          </div>

          {/* Benefits section */}
          <div className="bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-xl p-6 max-w-3xl mx-auto">
            <h3 className="text-xl font-semibold text-gray-900 mb-4 text-center">Why You Need This Tool</h3>
            <div className="grid md:grid-cols-3 gap-4 text-center">
              <div className="space-y-2">
                <div className="text-3xl">📋</div>
                <h4 className="font-semibold text-gray-800">Complete Conversations</h4>
                <p className="text-sm text-gray-600">Copy entire chats in one click - no more selecting text manually</p>
              </div>
              <div className="space-y-2">
                <div className="text-3xl">⚡</div>
                <h4 className="font-semibold text-gray-800">Save Time</h4>
                <p className="text-sm text-gray-600">Skip the tedious process of copying conversations piece by piece</p>
              </div>
              <div className="space-y-2">
                <div className="text-3xl">💾</div>
                <h4 className="font-semibold text-gray-800">Preserve Everything</h4>
                <p className="text-sm text-gray-600">Keep your valuable AI conversations for reference, sharing, or backup</p>
              </div>
            </div>
          </div>

          {/* How it works */}
          <div className="bg-white/60 backdrop-blur-sm border border-gray-200 rounded-xl p-6 max-w-2xl mx-auto">
            <h3 className="text-xl font-semibold text-gray-900 mb-4 text-center">How it works:</h3>
            <div className="space-y-4 text-left">
              <div className="flex items-start gap-4">
                <span className="bg-blue-100 text-blue-800 rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold flex-shrink-0 mt-0.5">1</span>
                <div>
                  <p className="font-semibold text-gray-800">Install the bookmarklet</p>
                  <p className="text-gray-600 text-sm">Drag our button to your bookmarks bar (takes 5 seconds)</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <span className="bg-blue-100 text-blue-800 rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold flex-shrink-0 mt-0.5">2</span>
                <div>
                  <p className="font-semibold text-gray-800">Visit any AI conversation</p>
                  <p className="text-gray-600 text-sm">Go to ChatGPT, Claude, Perplexity, or any other AI platform</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <span className="bg-blue-100 text-blue-800 rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold flex-shrink-0 mt-0.5">3</span>
                <div>
                  <p className="font-semibold text-gray-800">Click and copy</p>
                  <p className="text-gray-600 text-sm">Click the bookmarklet → Your complete conversation is instantly copied to clipboard</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <span className="bg-blue-100 text-blue-800 rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold flex-shrink-0 mt-0.5">4</span>
                <div>
                  <p className="font-semibold text-gray-800">Paste anywhere</p>
                  <p className="text-gray-600 text-sm">Paste your conversation into docs, emails, notes, or wherever you need it</p>
                </div>
              </div>
            </div>
          </div>

          {/* Supported platforms */}
          <div className="bg-white/60 backdrop-blur-sm border border-gray-200 rounded-xl p-6 max-w-3xl mx-auto">
            <h3 className="text-xl font-semibold text-gray-900 mb-4 text-center">Works with All Major AI Platforms</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
              <div className="flex items-center gap-3 p-3 bg-white/50 rounded-lg border border-gray-100">
                <span className="text-2xl">🤖</span>
                <span className="font-medium">ChatGPT</span>
              </div>
              <div className="flex items-center gap-3 p-3 bg-white/50 rounded-lg border border-gray-100">
                <span className="text-2xl">🧠</span>
                <span className="font-medium">Claude</span>
              </div>
              <div className="flex items-center gap-3 p-3 bg-white/50 rounded-lg border border-gray-100">
                <span className="text-2xl">🔍</span>
                <span className="font-medium">Perplexity</span>
              </div>
              <div className="flex items-center gap-3 p-3 bg-white/50 rounded-lg border border-gray-100">
                <span className="text-2xl">⚡</span>
                <span className="font-medium">Grok</span>
              </div>
              <div className="flex items-center gap-3 p-3 bg-white/50 rounded-lg border border-gray-100">
                <span className="text-2xl">💎</span>
                <span className="font-medium">Gemini</span>
              </div>
              <div className="flex items-center gap-3 p-3 bg-white/50 rounded-lg border border-gray-100">
                <span className="text-2xl">🚀</span>
                <span className="font-medium">Copilot</span>
              </div>
            </div>
            <div className="text-center mt-4 text-gray-600 text-sm">
              <p>✨ Plus many more AI platforms and tools</p>
            </div>
          </div>

          {/* Final CTA */}
          <div className="bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-xl p-6 max-w-2xl mx-auto text-center">
            <h3 className="text-lg font-semibold text-purple-800 mb-2">🎉 Ready to Get Started?</h3>
            <p className="text-purple-700 mb-4">
              Stop struggling with copying AI conversations manually. Get the complete chat in one click.
            </p>
            <Button 
              onClick={() => setShowBookmarkletModal(true)} 
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-8 py-3 font-semibold shadow-lg hover:shadow-xl transition-all duration-200"
            >
              Install Now & Start Copying
            </Button>
          </div>
        </div>
      </div>

      {/* Bookmarklet Modal */}
      <BookmarkletModal 
        isOpen={showBookmarkletModal} 
        onClose={() => setShowBookmarkletModal(false)} 
      />
    </div>
  );
}
