export function SkeletonCard() {
  return (
    <div className="card p-4 space-y-3">
      <div className="skeleton h-4 w-2/3" />
      <div className="skeleton h-8 w-1/2" />
      <div className="skeleton h-3 w-full" />
    </div>
  );
}

export function SkeletonRow() {
  return (
    <tr>
      {[1,2,3,4].map(i=>(
        <td key={i} className="px-4 py-3"><div className="skeleton h-4 rounded" /></td>
      ))}
    </tr>
  );
}

export function SkeletonList({ count=4 }) {
  return (
    <div className="space-y-2">
      {Array.from({length:count}).map((_,i)=>(
        <div key={i} className="skeleton h-14 rounded-2xl" />
      ))}
    </div>
  );
}
