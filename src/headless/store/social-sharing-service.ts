import {
  defineService,
  implementService,
  type ServiceFactoryConfig,
} from "@wix/services-definitions";
import { SignalsServiceDefinition } from "@wix/services-definitions/core-services/signals";
import type { Signal } from "../Signal";

// SocialSharingService
// 🧠 Purpose: Manages social media sharing functionality
// Provides methods to share product information across various social platforms
// Supports dynamic URL generation, tracking, and platform-specific formatting

export interface SharingPlatform {
  name: string;
  icon: string;
  color: string;
  shareUrl: string;
}

export interface SocialSharingServiceAPI {
  // --- State ---
  availablePlatforms: Signal<SharingPlatform[]>;
  shareCount: Signal<number>;
  lastSharedPlatform: Signal<string | null>;

  // --- Actions ---
  shareToFacebook: (url: string, title: string, description?: string) => void;
  shareToTwitter: (url: string, text: string, hashtags?: string[]) => void;
  shareToLinkedIn: (url: string, title: string, summary?: string) => void;
  shareToWhatsApp: (url: string, text: string) => void;
  shareToEmail: (url: string, subject: string, body: string) => void;
  copyToClipboard: (url: string) => Promise<boolean>;
  shareNative: (data: {
    title: string;
    text: string;
    url: string;
  }) => Promise<boolean>;
  trackShare: (platform: string) => void;
}

export const SocialSharingServiceDefinition =
  defineService<SocialSharingServiceAPI>("socialSharing");

export const SocialSharingService = implementService.withConfig<{
  productName: string;
  productUrl: string;
  productDescription?: string;
  productImage?: string;
}>()(SocialSharingServiceDefinition, ({ getService, config }) => {
  const signalsService = getService(SignalsServiceDefinition);

  // State signals
  const availablePlatforms: Signal<SharingPlatform[]> = signalsService.signal([
    {
      name: "Facebook",
      icon: "facebook",
      color: "#1877F2",
      shareUrl: "https://www.facebook.com/sharer/sharer.php",
    },
    {
      name: "Twitter",
      icon: "twitter",
      color: "#1DA1F2",
      shareUrl: "https://twitter.com/intent/tweet",
    },
    {
      name: "LinkedIn",
      icon: "linkedin",
      color: "#0A66C2",
      shareUrl: "https://www.linkedin.com/sharing/share-offsite/",
    },
    {
      name: "WhatsApp",
      icon: "whatsapp",
      color: "#25D366",
      shareUrl: "https://wa.me/",
    },
    {
      name: "Email",
      icon: "mail",
      color: "#EA4335",
      shareUrl: "mailto:",
    },
  ]);

  const shareCount: Signal<number> = signalsService.signal(0);
  const lastSharedPlatform: Signal<string | null> = signalsService.signal(null);

  // Helper function to open share window
  const openShareWindow = (url: string, platform: string) => {
    const width = 600;
    const height = 400;
    const left = (window.screen.width - width) / 2;
    const top = (window.screen.height - height) / 2;

    window.open(
      url,
      `share-${platform}`,
      `width=${width},height=${height},left=${left},top=${top},scrollbars=yes,resizable=yes`
    );

    trackShare(platform);
  };

  // Actions
  const shareToFacebook = (
    url: string,
    title: string,
    description?: string
  ) => {
    const shareUrl = new URL("https://www.facebook.com/sharer/sharer.php");
    shareUrl.searchParams.set("u", url);
    shareUrl.searchParams.set(
      "quote",
      `${title}${description ? ` - ${description}` : ""}`
    );

    openShareWindow(shareUrl.toString(), "facebook");
  };

  const shareToTwitter = (url: string, text: string, hashtags?: string[]) => {
    const shareUrl = new URL("https://twitter.com/intent/tweet");
    shareUrl.searchParams.set("url", url);
    shareUrl.searchParams.set("text", text);
    if (hashtags && hashtags.length > 0) {
      shareUrl.searchParams.set("hashtags", hashtags.join(","));
    }

    openShareWindow(shareUrl.toString(), "twitter");
  };

  const shareToLinkedIn = (url: string, title: string, summary?: string) => {
    const shareUrl = new URL("https://www.linkedin.com/sharing/share-offsite/");
    shareUrl.searchParams.set("url", url);
    shareUrl.searchParams.set("title", title);
    if (summary) {
      shareUrl.searchParams.set("summary", summary);
    }

    openShareWindow(shareUrl.toString(), "linkedin");
  };

  const shareToWhatsApp = (url: string, text: string) => {
    const message = `${text} ${url}`;
    const shareUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;

    openShareWindow(shareUrl, "whatsapp");
  };

  const shareToEmail = (url: string, subject: string, body: string) => {
    const emailBody = `${body}\n\n${url}`;
    const mailtoUrl = `mailto:?subject=${encodeURIComponent(
      subject
    )}&body=${encodeURIComponent(emailBody)}`;

    window.location.href = mailtoUrl;
    trackShare("email");
  };

  const copyToClipboard = async (url: string): Promise<boolean> => {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(url);
        trackShare("clipboard");
        return true;
      } else {
        // Fallback for older browsers
        const textArea = document.createElement("textarea");
        textArea.value = url;
        textArea.style.position = "fixed";
        textArea.style.left = "-999999px";
        textArea.style.top = "-999999px";
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        const success = document.execCommand("copy");
        textArea.remove();

        if (success) {
          trackShare("clipboard");
        }
        return success;
      }
    } catch (err) {
      console.error("Failed to copy to clipboard:", err);
      return false;
    }
  };

  const shareNative = async (data: {
    title: string;
    text: string;
    url: string;
  }): Promise<boolean> => {
    try {
      if (navigator.share) {
        await navigator.share(data);
        trackShare("native");
        return true;
      }
      return false;
    } catch (err) {
      console.error("Failed to share natively:", err);
      return false;
    }
  };

  const trackShare = (platform: string) => {
    const currentCount = shareCount.get();
    shareCount.set(currentCount + 1);
    lastSharedPlatform.set(platform);

    // You could also send analytics events here
    console.log(`Shared to ${platform} - Total shares: ${currentCount + 1}`);
  };

  return {
    // State
    availablePlatforms,
    shareCount,
    lastSharedPlatform,

    // Actions
    shareToFacebook,
    shareToTwitter,
    shareToLinkedIn,
    shareToWhatsApp,
    shareToEmail,
    copyToClipboard,
    shareNative,
    trackShare,
  };
});

export async function loadSocialSharingServiceConfig(
  productName: string,
  productUrl: string,
  productDescription?: string,
  productImage?: string
): Promise<ServiceFactoryConfig<typeof SocialSharingService>> {
  return {
    productName,
    productUrl,
    productDescription,
    productImage,
  };
}
