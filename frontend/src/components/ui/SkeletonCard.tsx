export default function SkeletonCard() {
  return (
    <div
      style={{
        background: "#fff",
        border: "1px solid #e8e8e8",
        borderRadius: "6px",
        display: "flex",
        marginBottom: "10px",
        overflow: "hidden",
      }}
    >
      <div style={{ width: "160px", height: "192px", background: "#f0f0f0", flexShrink: 0, animation: "pulse 1.5s ease-in-out infinite" }} />
      <div style={{ flex: 1, padding: "1rem" }}>
        <div style={{ width: "120px", height: "14px", background: "#f0f0f0", borderRadius: "4px", marginBottom: "8px", animation: "pulse 1.5s ease-in-out infinite" }} />
        <div style={{ width: "200px", height: "20px", background: "#f0f0f0", borderRadius: "4px", marginBottom: "6px", animation: "pulse 1.5s ease-in-out infinite" }} />
        <div style={{ width: "80%", height: "13px", background: "#f0f0f0", borderRadius: "4px", marginBottom: "12px", animation: "pulse 1.5s ease-in-out infinite" }} />
        <div style={{ width: "60%", height: "13px", background: "#f0f0f0", borderRadius: "4px", animation: "pulse 1.5s ease-in-out infinite" }} />
      </div>
    </div>
  );
}
