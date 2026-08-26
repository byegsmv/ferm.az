"use client";
/**
 * Drop-in replacement for next/image's <Image>.
 * Guards against null/undefined/empty src — renders nothing in that case.
 * Also handles placehold.co and other SVG hosts via plain <img>.
 */
import Image from "next/image";
import Icon from "@/components/ui/Icon";

const UNOPTIMIZED_HOSTS = ["placehold.co", "via.placeholder.com"];

function needsPlainImg(src) {
  if (typeof src !== "string") return false;
  try {
    const { hostname } = new URL(src);
    return UNOPTIMIZED_HOSTS.some((h) => hostname === h || hostname.endsWith(`.${h}`));
  } catch {
    return false;
  }
}

export default function SafeImage({ src, alt, fill, width, height, className, sizes, style, ...rest }) {
  // Guard: null/undefined/empty src causes next/image crash
  if (!src) {
    if (fill) {
      return <div className={`absolute inset-0 bg-gray-100 flex items-center justify-center text-brand-300 ${className || ""}`}><Icon name="sprout" size={30} strokeWidth={1.2} /></div>;
    }
    return (
      <div
        className={`bg-gray-100 flex items-center justify-center ${className || ""}`}
        style={{ width: width || "100%", height: height || "100%" }}
      >
        <Icon name="sprout" size={25} strokeWidth={1.2} className="text-brand-300" />
      </div>
    );
  }

  if (needsPlainImg(src)) {
    if (fill) {
      return (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt={alt || ""}
          className={`absolute inset-0 w-full h-full object-cover ${className || ""}`}
          style={style}
          {...rest}
        />
      );
    }
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={src} alt={alt || ""} width={width} height={height} className={className} style={style} {...rest} />
    );
  }

  return (
    <Image
      src={src}
      alt={alt || ""}
      fill={fill}
      width={fill ? undefined : (width || 400)}
      height={fill ? undefined : (height || 300)}
      sizes={sizes}
      className={className}
      style={style}
      {...rest}
    />
  );
}
