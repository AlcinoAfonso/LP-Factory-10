export function AssistantMessageText({ text }: { text: string }) {
  return <>{text.split(/(https?:\/\/[^\s<>]+)/gu).map((part, index) =>
    /^https?:\/\//u.test(part)
      ? <a key={index} href={part} target="_blank" rel="noopener noreferrer" className="break-all underline underline-offset-2">{part}</a>
      : part)}</>;
}
