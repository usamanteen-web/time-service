'use client';
import SplitChars from './SplitChars';

/**
 * Two-line section heading. Characters tilt and skew into place as the heading
 * scrolls into view (the same motion as the About us page).
 */
export default function KineticHeading({first, second, className=''}: {first: string; second: string; className?: string}) {
  return <SplitChars as="h2" variant="skew" className={`kinetic-heading ${className}`.trim()} lines={[first, {text: second, italic: true}]}/>;
}
