import React from 'react'

export function App() {
  return (
    <div className="w-80 h-[346px] border border-gray-200 mx-auto mt-5 flex flex-col bg-white rounded-lg shadow-sm">
      <div className="h-2 border-b border-gray-200 px-2 flex items-center">
        <div className="w-0.5 h-0.5 rounded-full bg-teal-500" />
      </div>

      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
        <div className="flex justify-start">
          <div className="rounded-lg p-3 max-w-[80%] bg-gray-100">
            <p className="text-gray-800 m-0">Hi! How can I help you today?</p>
            <span className="text-xs text-gray-500 mt-1 block">Assistant • Just now</span>
          </div>
        </div>
      </div>

      <div className="border-t border-gray-200 p-4">
        <div className="flex gap-2">
          <input 
            type="text" 
            placeholder="Type your message..." 
            className="flex-1 rounded-lg border border-gray-300 px-4 py-2 focus:outline-none"
          />
          <button className="bg-blue-500 text-white px-4 py-2 rounded-lg border-0 cursor-pointer">
            Send
          </button>
        </div>
      </div>
    </div>
  )
}
