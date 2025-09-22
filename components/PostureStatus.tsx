export default function PostureStatus({tele}:{tele:Record<string,any>}){
  const ok = (v:boolean|undefined, goodLabel:string, badLabel:string)=> v? <span className="badge badge-green">{goodLabel}</span> : <span className="badge badge-amber">{badLabel}</span>;
  return (<div className="space-y-2 text-sm">
    <div>Posture: {ok(tele.posture_ok,'OK','Điều chỉnh')}</div>
    <div>Cuff: {ok(tele.cuff_ok,'OK','Chưa xác định')}</div>
    <div>Mouth: {tele.mouth_open? <span className="badge badge-red">Mở</span> : <span className="badge badge-green">Đóng</span>}</div>
    <div>Speech: {tele.speak? <span className="badge badge-red">Đang nói</span> : <span className="badge badge-green">Im lặng</span>}</div>
  </div>);
}
