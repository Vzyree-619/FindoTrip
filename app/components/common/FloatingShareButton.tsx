import { useState } from 'react';
import { Share2, X, Copy, Facebook, MessageCircle, Mail, QrCode } from 'lucide-react';
import ShareModal from './ShareModal';

interface FloatingShareButtonProps {
  title: string;
  url: string;
  description?: string;
  image?: string;
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
  variant?: 'floating' | 'fixed';
}

export default function FloatingShareButton({
  title,
  url,
  description = "Check out this amazing listing!",
  image,
  position = 'bottom-right',
  variant = 'floating'
}: FloatingShareButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [showQuickOptions, setShowQuickOptions] = useState(false);

  const positionClasses = {
    'bottom-right': 'bottom-6 right-6',
    'bottom-left': 'bottom-6 left-6',
    'top-right': 'top-6 right-6',
    'top-left': 'top-6 left-6'
  };

  const quickShareOptions = [
    {
      id: 'copy',
      icon: Copy,
      label: 'Copy Link',
      action: () => navigator.clipboard.writeText(url)
    },
    {
      id: 'facebook',
      icon: Facebook,
      label: 'Facebook',
      action: () => window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`, '_blank')
    },
    {
      id: 'twitter',
      icon: X,
      label: 'X',
      action: () => window.open(`https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`, '_blank')
    },
    {
      id: 'whatsapp',
      icon: MessageCircle,
      label: 'WhatsApp',
      action: () => window.open(`https://wa.me/?text=${encodeURIComponent(title)}%20${encodeURIComponent(url)}`, '_blank')
    }
  ];

  if (variant === 'floating') {
    return (
      <>
        <div className={`fixed ${positionClasses[position]} z-40`}>
          {showQuickOptions && (
            <div className="mb-4 space-y-2">
              {quickShareOptions.map((option) => (
                <button
                  key={option.id}
                  onClick={() => {
                    option.action();
                    setShowQuickOptions(false);
                  }}
                  className="flex items-center gap-3 p-3 bg-white rounded-full shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105 border border-gray-200"
                  title={option.label}
                >
                  <option.icon className="w-5 h-5 text-gray-600" />
                </button>
              ))}
            </div>
          )}
          
          <button
            onClick={() => setShowQuickOptions(!showQuickOptions)}
            className="w-14 h-14 bg-[#01502E] text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-110 flex items-center justify-center"
          >
            {showQuickOptions ? (
              <X className="w-6 h-6" />
            ) : (
              <Share2 className="w-6 h-6" />
            )}
          </button>
        </div>

        <ShareModal
          open={isOpen}
          onClose={() => setIsOpen(false)}
          title={title}
          url={url}
          description={description}
          image={image}
        />
      </>
    );
  }

  return (
    <div className={`fixed ${positionClasses[position]} z-40`}>
      <button
        onClick={() => setIsOpen(true)}
        className="w-14 h-14 bg-[#01502E] text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-110 flex items-center justify-center"
      >
        <Share2 className="w-6 h-6" />
      </button>

      <ShareModal
        open={isOpen}
        onClose={() => setIsOpen(false)}
        title={title}
        url={url}
        description={description}
        image={image}
      />
    </div>
  );
}
