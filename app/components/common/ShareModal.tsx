import { useEffect, useState } from 'react';
import { 
  Copy, 
  X, 
  Facebook, 
  MessageCircle, 
  Mail, 
  QrCode, 
  Download, 
  Share2,
  Check,
  ExternalLink,
  Smartphone,
  Link as LinkIcon
} from 'lucide-react';

interface ShareModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  url: string;
  description?: string;
  image?: string;
}

export default function ShareModal({ 
  open, 
  onClose, 
  title, 
  url, 
  description = "Check out this amazing listing!",
  image 
}: ShareModalProps) {
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'link' | 'social' | 'qr'>('link');
  const [qrCode, setQrCode] = useState<string>('');

  useEffect(() => {
    function handleKey(e: KeyboardEvent) { 
      if (e.key === 'Escape') onClose(); 
    }
    if (open) {
      document.addEventListener('keydown', handleKey);
      generateQRCode();
    }
    return () => document.removeEventListener('keydown', handleKey);
  }, [open, onClose, url]);

  const generateQRCode = async () => {
    try {
      // Simple QR code generation using a free service
      const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(url)}`;
      setQrCode(qrUrl);
    } catch (error) {
      console.error('Error generating QR code:', error);
    }
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  const shareToSocial = (platform: string) => {
    const encodedUrl = encodeURIComponent(url);
    const encodedTitle = encodeURIComponent(title);
    const encodedDescription = encodeURIComponent(description);
    
    let shareUrl = '';
    
    switch (platform) {
      case 'facebook':
        shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`;
        break;
      case 'twitter':
        shareUrl = `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`;
        break;
      case 'whatsapp':
        shareUrl = `https://wa.me/?text=${encodedTitle}%20${encodedUrl}`;
        break;
      case 'telegram':
        shareUrl = `https://t.me/share/url?url=${encodedUrl}&text=${encodedTitle}`;
        break;
      case 'email':
        shareUrl = `mailto:?subject=${encodedTitle}&body=${encodedDescription}%0A%0A${encodedUrl}`;
        break;
    }
    
    if (shareUrl) {
      window.open(shareUrl, '_blank', 'width=600,height=400');
    }
  };

  const downloadQRCode = () => {
    if (qrCode) {
      const link = document.createElement('a');
      link.href = qrCode;
      link.download = `${title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_qr.png`;
      link.click();
    }
  };

  const shareOptions = [
    {
      id: 'facebook',
      name: 'Facebook',
      icon: Facebook,
      color: 'bg-blue-600 hover:bg-blue-700',
      onClick: () => shareToSocial('facebook')
    },
    {
      id: 'twitter',
      name: 'X',
      icon: X,
      color: 'bg-black hover:bg-gray-800',
      onClick: () => shareToSocial('twitter')
    },
    {
      id: 'whatsapp',
      name: 'WhatsApp',
      icon: MessageCircle,
      color: 'bg-green-600 hover:bg-green-700',
      onClick: () => shareToSocial('whatsapp')
    },
    {
      id: 'telegram',
      name: 'Telegram',
      icon: MessageCircle,
      color: 'bg-blue-500 hover:bg-blue-600',
      onClick: () => shareToSocial('telegram')
    },
    {
      id: 'email',
      name: 'Email',
      icon: Mail,
      color: 'bg-gray-600 hover:bg-gray-700',
      onClick: () => shareToSocial('email')
    }
  ];

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[#01502E]/10 rounded-lg">
              <Share2 className="w-5 h-5 text-[#01502E]" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Share</h3>
              <p className="text-sm text-gray-500 truncate max-w-48">{title}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200">
          {[
            { id: 'link', label: 'Link', icon: LinkIcon },
            { id: 'social', label: 'Social', icon: Share2 },
            { id: 'qr', label: 'QR Code', icon: QrCode }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex-1 flex items-center justify-center gap-2 py-4 px-2 text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'text-[#01502E] border-b-2 border-[#01502E] bg-[#01502E]/5'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="p-6">
          {activeTab === 'link' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Share Link
                </label>
                <div className="flex gap-2">
                  <input
                    value={url}
                    readOnly
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-900 text-sm"
                  />
                  <button
                    onClick={handleCopyLink}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${
                      copied
                        ? 'bg-green-100 text-green-700 border border-green-200'
                        : 'bg-[#01502E] text-white hover:bg-[#013d23]'
                    }`}
                  >
                    {copied ? (
                      <>
                        <Check className="w-4 h-4" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4" />
                        Copy
                      </>
                    )}
                  </button>
                </div>
              </div>
              
              <div className="pt-4 border-t border-gray-200">
                <p className="text-sm text-gray-600 mb-3">Quick Actions</p>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => window.open(url, '_blank')}
                    className="flex items-center gap-2 px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <ExternalLink className="w-4 h-4" />
                    Open Link
                  </button>
                  <button
                    onClick={handleCopyLink}
                    className="flex items-center gap-2 px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <Copy className="w-4 h-4" />
                    Copy Again
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'social' && (
            <div className="space-y-4">
              <p className="text-sm text-gray-600 mb-4">
                Share on your favorite social platform
              </p>
              <div className="grid grid-cols-2 gap-3">
                {shareOptions.map((option) => (
                  <button
                    key={option.id}
                    onClick={option.onClick}
                    className={`flex items-center gap-3 p-4 rounded-xl text-white font-medium transition-all duration-200 transform hover:scale-105 hover:shadow-lg ${option.color}`}
                  >
                    <option.icon className="w-5 h-5" />
                    {option.name}
                  </button>
                ))}
              </div>
              
              <div className="pt-4 border-t border-gray-200">
                <p className="text-sm text-gray-600 mb-3">Or share directly</p>
                <button
                  onClick={() => {
                    if (navigator.share) {
                      navigator.share({
                        title,
                        text: description,
                        url
                      });
                    } else {
                      handleCopyLink();
                    }
                  }}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-[#01502E] text-white rounded-lg hover:bg-[#013d23] transition-colors"
                >
                  <Smartphone className="w-5 h-5" />
                  Native Share
                </button>
              </div>
            </div>
          )}

          {activeTab === 'qr' && (
            <div className="space-y-4 text-center">
              <p className="text-sm text-gray-600 mb-4">
                Scan this QR code to open the link
              </p>
              
              {qrCode ? (
                <div className="flex flex-col items-center space-y-4">
                  <div className="p-4 bg-white rounded-xl shadow-lg">
                    <img
                      src={qrCode}
                      alt="QR Code"
                      className="w-48 h-48"
                    />
                  </div>
                  
                  <div className="flex gap-2">
                    <button
                      onClick={downloadQRCode}
                      className="flex items-center gap-2 px-4 py-2 bg-[#01502E] text-white rounded-lg hover:bg-[#013d23] transition-colors"
                    >
                      <Download className="w-4 h-4" />
                      Download
                    </button>
                    <button
                      onClick={() => window.open(qrCode, '_blank')}
                      className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <ExternalLink className="w-4 h-4" />
                      View
                    </button>
                  </div>
                </div>
              ) : (
                <div className="py-8">
                  <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                    <QrCode className="w-8 h-8 text-gray-400" />
                  </div>
                  <p className="text-sm text-gray-500">Generating QR code...</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
          <div className="flex items-center justify-between text-xs text-gray-500">
            <span>Share with friends and family</span>
            <span>FindoTrip</span>
          </div>
        </div>
      </div>
    </div>
  );
}

