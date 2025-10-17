import { useState, useEffect, useRef } from "react";
import { Form, useFetcher } from "@remix-run/react";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Badge } from "~/components/ui/badge";
import { 
  MessageCircle, 
  Send, 
  Paperclip, 
  X, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  User,
  Bot
} from "lucide-react";

interface SupportMessage {
  id: string;
  content: string;
  type: string;
  createdAt: string;
  sender: {
    name: string;
    role: string;
  };
  isRead: boolean;
  attachments?: string[];
  systemData?: any;
}

interface SupportTicket {
  id: string;
  ticketNumber: string;
  title: string;
  status: string;
  priority: string;
  category: string;
  createdAt: string;
  lastMessageAt: string;
  assignedTo?: {
    name: string;
  };
  messages: SupportMessage[];
}

interface SupportChatProps {
  ticket?: SupportTicket;
  isOpen: boolean;
  onClose: () => void;
  onTicketCreated?: (ticket: SupportTicket) => void;
}

export default function SupportChat({ ticket, isOpen, onClose, onTicketCreated }: SupportChatProps) {
  const [newMessage, setNewMessage] = useState("");
  const [isCreatingTicket, setIsCreatingTicket] = useState(!ticket);
  const [ticketForm, setTicketForm] = useState({
    title: "",
    description: "",
    category: "TECHNICAL_SUPPORT",
    priority: "NORMAL",
  });
  const [attachments, setAttachments] = useState<File[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetcher = useFetcher();

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [ticket?.messages]);

  const handleSendMessage = () => {
    if (!newMessage.trim() || !ticket) return;

    const formData = new FormData();
    formData.append("intent", "sendMessage");
    formData.append("ticketId", ticket.id);
    formData.append("content", newMessage);
    
    if (attachments.length > 0) {
      attachments.forEach((file, index) => {
        formData.append(`attachment-${index}`, file);
      });
    }

    fetcher.submit(formData, { method: "post", encType: "multipart/form-data" });
    setNewMessage("");
    setAttachments([]);
  };

  const handleCreateTicket = () => {
    if (!ticketForm.title.trim() || !ticketForm.description.trim()) return;

    const formData = new FormData();
    formData.append("intent", "createTicket");
    formData.append("title", ticketForm.title);
    formData.append("description", ticketForm.description);
    formData.append("category", ticketForm.category);
    formData.append("priority", ticketForm.priority);

    fetcher.submit(formData, { method: "post" });
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    setAttachments(prev => [...prev, ...files]);
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "NEW": return "bg-[#01502E]/10 text-[#01502E]";
      case "IN_PROGRESS": return "bg-yellow-100 text-yellow-800";
      case "WAITING": return "bg-orange-100 text-orange-800";
      case "RESOLVED": return "bg-green-100 text-green-800";
      case "CLOSED": return "bg-gray-100 text-gray-800";
      case "ESCALATED": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "LOW": return "bg-gray-100 text-gray-800";
      case "NORMAL": return "bg-[#01502E]/10 text-[#01502E]";
      case "HIGH": return "bg-orange-100 text-orange-800";
      case "URGENT": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getMessageIcon = (senderRole: string, messageType: string) => {
    if (messageType === "SYSTEM") {
      return <Bot className="h-4 w-4 text-gray-500" />;
    }
    return senderRole === "SUPER_ADMIN" ? 
      <Bot className="h-4 w-4 text-[#01502E]" /> : 
      <User className="h-4 w-4 text-gray-500" />;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <Card className="w-full max-w-4xl h-[80vh] flex flex-col">
        <CardHeader className="flex-shrink-0">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center">
              <MessageCircle className="h-5 w-5 mr-2" />
              {ticket ? `Support Ticket: ${ticket.ticketNumber}` : "Contact Support"}
            </CardTitle>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
          
          {ticket && (
            <div className="flex items-center space-x-4 mt-2">
              <Badge className={getStatusColor(ticket.status)}>
                {ticket.status.replace("_", " ")}
              </Badge>
              <Badge className={getPriorityColor(ticket.priority)}>
                {ticket.priority}
              </Badge>
              <span className="text-sm text-gray-600">
                {ticket.category.replace("_", " ")}
              </span>
              {ticket.assignedTo && (
                <span className="text-sm text-gray-600">
                  Assigned to: {ticket.assignedTo.name}
                </span>
              )}
            </div>
          )}
        </CardHeader>

        <CardContent className="flex-1 flex flex-col overflow-hidden">
          {isCreatingTicket ? (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Title</label>
                <Input
                  value={ticketForm.title}
                  onChange={(e) => setTicketForm(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Brief description of your issue"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Description</label>
                <textarea
                  className="w-full p-3 border border-gray-300 rounded-md"
                  rows={4}
                  value={ticketForm.description}
                  onChange={(e) => setTicketForm(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Please provide detailed information about your issue..."
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Category</label>
                  <select
                    className="w-full p-2 border border-gray-300 rounded-md"
                    value={ticketForm.category}
                    onChange={(e) => setTicketForm(prev => ({ ...prev, category: e.target.value }))}
                  >
                    <option value="ACCOUNT_ISSUES">Account Issues</option>
                    <option value="APPROVAL_QUESTIONS">Approval Questions</option>
                    <option value="TECHNICAL_SUPPORT">Technical Support</option>
                    <option value="PAYMENT_ISSUES">Payment Issues</option>
                    <option value="POLICY_QUESTIONS">Policy Questions</option>
                    <option value="FEATURE_REQUEST">Feature Request</option>
                    <option value="BUG_REPORT">Bug Report</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">Priority</label>
                  <select
                    className="w-full p-2 border border-gray-300 rounded-md"
                    value={ticketForm.priority}
                    onChange={(e) => setTicketForm(prev => ({ ...prev, priority: e.target.value }))}
                  >
                    <option value="LOW">Low</option>
                    <option value="NORMAL">Normal</option>
                    <option value="HIGH">High</option>
                    <option value="URGENT">Urgent</option>
                  </select>
                </div>
              </div>
              
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setIsCreatingTicket(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateTicket} disabled={fetcher.state === "submitting"}>
                  {fetcher.state === "submitting" ? "Creating..." : "Create Ticket"}
                </Button>
              </div>
            </div>
          ) : ticket ? (
            <>
              {/* Messages */}
              <div className="flex-1 overflow-y-auto space-y-4 mb-4">
                {ticket.messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.sender.role === "SUPER_ADMIN" ? "justify-start" : "justify-end"}`}
                  >
                    <div
                      className={`max-w-[80%] p-3 rounded-lg ${
                        message.sender.role === "SUPER_ADMIN"
                          ? "bg-[#01502E]/10 border border-[#01502E]/20"
                          : "bg-white border border-gray-200"
                      }`}
                    >
                      <div className="flex items-center space-x-2 mb-1">
                        {getMessageIcon(message.sender.role, message.type)}
                        <span className="text-sm font-medium">{message.sender.name}</span>
                        <span className="text-xs text-gray-500">
                          {new Date(message.createdAt).toLocaleString()}
                        </span>
                        {message.isRead && message.sender.role !== "SUPER_ADMIN" && (
                          <CheckCircle className="h-3 w-3 text-green-500" />
                        )}
                      </div>
                      <p className="text-sm">{message.content}</p>
                      
                      {message.attachments && message.attachments.length > 0 && (
                        <div className="mt-2 space-y-1">
                          {message.attachments.map((attachment, index) => (
                            <a
                              key={index}
                              href={attachment}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-[#01502E] hover:underline"
                            >
                              📎 {attachment.split("/").pop()}
                            </a>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>

              {/* Message Input */}
              <div className="flex-shrink-0 border-t pt-4">
                {attachments.length > 0 && (
                  <div className="mb-2 flex flex-wrap gap-2">
                    {attachments.map((file, index) => (
                      <div key={index} className="flex items-center space-x-1 bg-gray-100 px-2 py-1 rounded">
                        <span className="text-xs">{file.name}</span>
                        <button
                          onClick={() => removeAttachment(index)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                
                <div className="flex space-x-2">
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Paperclip className="h-4 w-4" />
                  </Button>
                  
                  <Input
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type your message..."
                    onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
                    className="flex-1"
                  />
                  
                  <Button
                    onClick={handleSendMessage}
                    disabled={!newMessage.trim() || fetcher.state === "submitting"}
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <MessageCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Active Support Ticket</h3>
                <p className="text-gray-600 mb-4">
                  Start a new conversation with our support team
                </p>
                <Button onClick={() => setIsCreatingTicket(true)}>
                  Create New Ticket
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
