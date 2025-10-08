import React, { useState } from "react";
import { Button } from "~/components/ui/button";

export function ChatTestSuite() {
  const [results, setResults] = useState<Record<string, boolean>>({});
  const [currentTest, setCurrentTest] = useState<string>("");

  const runTest = async (testName: string, testFn: () => Promise<boolean>) => {
    setCurrentTest(testName);
    try {
      const result = await testFn();
      setResults(prev => ({ ...prev, [testName]: result }));
    } catch (error) {
      console.error(`Test ${testName} failed:`, error);
      setResults(prev => ({ ...prev, [testName]: false }));
    }
    setCurrentTest("");
  };

  const tests = {
    "Message Send/Receive": async () => {
      // Test basic message sending
      const response = await fetch("/api/chat.send", {
        method: "POST",
        body: new FormData(),
      });
      return response.ok;
    },
    
    "Conversation Loading": async () => {
      // Test conversation loading
      const response = await fetch("/api/chat.conversations");
      return response.ok;
    },
    
    "Presence Detection": async () => {
      // Test presence API
      const response = await fetch("/api/chat.presence?userIds=test");
      return response.ok;
    },
    
    "Typing Indicators": async () => {
      // Test typing API
      const response = await fetch("/api/chat.typing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ conversationId: "test:test", isTyping: true }),
      });
      return response.ok;
    },
    
    "Read Receipts": async () => {
      // Test read receipts
      const response = await fetch("/api/chat.read", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ conversationId: "test:test" }),
      });
      return response.ok;
    },
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow">
      <h2 className="text-xl font-bold mb-4">Chat System Test Suite</h2>
      
      <div className="space-y-3">
        {Object.entries(tests).map(([name, testFn]) => (
          <div key={name} className="flex items-center justify-between p-3 border rounded">
            <span className="font-medium">{name}</span>
            <div className="flex items-center gap-2">
              {results[name] !== undefined && (
                <span className={`px-2 py-1 rounded text-sm ${
                  results[name] ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                }`}>
                  {results[name] ? "PASS" : "FAIL"}
                </span>
              )}
              <Button
                size="sm"
                onClick={() => runTest(name, testFn)}
                disabled={currentTest === name}
              >
                {currentTest === name ? "Testing..." : "Run Test"}
              </Button>
            </div>
          </div>
        ))}
      </div>
      
      <div className="mt-6 p-4 bg-gray-50 rounded">
        <h3 className="font-semibold mb-2">Test Results Summary</h3>
        <div className="text-sm">
          Passed: {Object.values(results).filter(Boolean).length} / {Object.keys(tests).length}
        </div>
        {Object.values(results).every(Boolean) && Object.keys(results).length === Object.keys(tests).length && (
          <div className="text-green-600 font-medium mt-2">✅ All tests passed!</div>
        )}
      </div>
    </div>
  );
}
