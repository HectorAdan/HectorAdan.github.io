export function TechnologyTags({ items }: { items: string[] }) {
  return <ul className="panel-tags" aria-label="Technologies">
    {items.map(item => <li key={item}>{item}</li>)}
  </ul>;
}
