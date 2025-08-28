import React, { useEffect, useMemo, useState } from 'react'

const API_BASE = 'http://localhost:4000'

type LeaveType = '연차' | '반차' | '병가' | '경조사'
type RequestStatus = 'Pending' | 'Approved' | 'Rejected' | 'Canceled'

interface LeaveRequestAPI {
  requestId: string
  dateRequested: string
  empId: string
  name: string
  dept: string
  position: string
  leaveType: LeaveType
  startDate: string
  endDate: string
  note?: string
  status: RequestStatus
}

function todayStr(){
  const d = new Date();
  const mm = String(d.getMonth()+1).padStart(2,'0');
  const dd = String(d.getDate()).padStart(2,'0');
  return `${d.getFullYear()}-${mm}-${dd}`;
}

export default function EmployeeLeavePage(){
  const [form, setForm] = useState({
    empId: '',
    name: '',
    position: '',
    dept: '개발팀' as '개발팀' | '생산지원팀' | '생산팀' | '공무팀',
    leaveType: '연차' as LeaveType,
    startDate: todayStr(),
    endDate: todayStr(),
    note: '개인사유',
  });
  const [dialog, setDialog] = useState<{open:boolean; success?:boolean; message?:string}>({open:false})
  const [list, setList] = useState<LeaveRequestAPI[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(()=>{
    const style = document.createElement('style')
    style.innerHTML = `
      .input{display:block;width:100%;margin:4px 0;padding:6px;border:1px solid #cbd5e1;border-radius:6px}
      .btn{padding:8px 12px;border-radius:6px;border:1px solid #cbd5e1;background:#fff}
      .btn-primary{padding:8px 12px;background:#2563eb;color:#fff;border:0;border-radius:6px}
      .table{border-collapse:collapse;width:100%}
      .th{position:sticky;top:0;background:#f8fafc;text-align:left;padding:8px;border-bottom:1px solid #e5e7eb}
      .td{padding:8px;border-top:1px solid #f1f5f9}
    `
    document.head.appendChild(style)
    return () => { try{style.remove()}catch{} }
  }, [])

  async function load(){
    setLoading(true)
    try{
      const r = await fetch(`${API_BASE}/api/requests/recent`)
      if(!r.ok) throw new Error('목록 조회 실패')
      const j = await r.json()
      setList(Array.isArray(j?.data)? j.data: [])
    }catch(e:any){
      console.error(e)
    }finally{ setLoading(false) }
  }

  useEffect(()=>{ load() }, [])

  async function submit(){
    const errs: string[] = []
    if(!form.empId) errs.push('사번을 입력하세요')
    if(!form.name) errs.push('이름을 입력하세요')
    if(!form.position) errs.push('직급을 입력하세요')
    if(!form.startDate) errs.push('신청일을 선택하세요')
    if(!form.endDate) errs.push('마지막일을 선택하세요')
    if (errs.length){ setDialog({ open:true, success:false, message: errs.join('\n') }); return }

    const payload = {
      dateRequested: todayStr(),
      empId: form.empId,
      name: form.name,
      dept: form.dept,
      position: form.position,
      leaveType: form.leaveType,
      startDate: form.startDate,
      endDate: form.endDate,
      note: form.note,
      status: 'Pending' as RequestStatus
    }

    try{
      const r = await fetch(`${API_BASE}/api/requests`, {
        method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(payload)
      })
      if(!r.ok){
        const j = await r.json().catch(()=>({error:'저장 실패'}))
        throw new Error(j?.error || '저장 실패')
      }
      setDialog({ open:true, success:true, message:'신청이 완료되었습니다.' })
      setForm(f=>({ ...f, empId:'', name:'', position:'', startDate: todayStr(), endDate: todayStr(), note:'개인사유' }))
      await load()
    }catch(e:any){
      setDialog({ open:true, success:false, message: e?.message || String(e) })
    }
  }

  const recent = useMemo(()=> list, [list])

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h1 className="text-xl font-bold mb-4">연차 신청</h1>
      <div className="grid grid-cols-2 gap-2">
        <input className="input" placeholder="사번" value={form.empId} onChange={e=>setForm(f=>({...f, empId:e.target.value}))} />
        <input className="input" placeholder="이름" value={form.name} onChange={e=>setForm(f=>({...f, name:e.target.value}))} />
        <input className="input" placeholder="직급" value={form.position} onChange={e=>setForm(f=>({...f, position:e.target.value}))} />
        <select className="input" value={form.dept} onChange={e=>setForm(f=>({...f, dept: e.target.value as any}))}>
          <option value="개발팀">개발팀</option>
          <option value="생산지원팀">생산지원팀</option>
          <option value="생산팀">생산팀</option>
          <option value="공무팀">공무팀</option>
        </select>
        <select className="input" value={form.leaveType} onChange={e=>setForm(f=>({...f, leaveType: e.target.value as LeaveType}))}>
          <option value="연차">연차</option>
          <option value="반차">반차</option>
          <option value="병가">병가</option>
          <option value="경조사">경조사</option>
        </select>
        <div className="grid grid-cols-2 gap-2">
          <input className="input" type="date" value={form.startDate} onChange={e=>setForm(f=>({...f, startDate:e.target.value}))} />
          <input className="input" type="date" value={form.endDate} onChange={e=>setForm(f=>({...f, endDate:e.target.value}))} />
        </div>
        <input className="input col-span-2" placeholder="사유" value={form.note} onChange={e=>setForm(f=>({...f, note:e.target.value}))} />
      </div>
      <div className="mt-2">
        <button className="btn-primary" onClick={submit}>신청하기</button>
      </div>

      <h2 className="text-lg font-semibold mt-8 mb-2">최근 한달 신청 현황</h2>
      {loading ? <p>불러오는 중…</p> : (
        <div className="overflow-auto rounded-lg border">
          <table className="table text-sm">
            <thead>
              <tr>
                <th className="th">신청일</th>
                <th className="th">사번</th>
                <th className="th">이름</th>
                <th className="th">부서</th>
                <th className="th">직급</th>
                <th className="th">연차종류</th>
                <th className="th">기간</th>
                <th className="th">상태</th>
              </tr>
            </thead>
            <tbody>
              {recent.length===0 ? (
                <tr><td className="td" colSpan={8}>표시할 데이터가 없습니다.</td></tr>
              ) : recent.map(r=> (
                <tr key={r.requestId}>
                  <td className="td">{r.dateRequested}</td>
                  <td className="td">{r.empId}</td>
                  <td className="td">{r.name}</td>
                  <td className="td">{r.dept}</td>
                  <td className="td">{r.position}</td>
                  <td className="td">{r.leaveType}</td>
                  <td className="td">{r.startDate} ~ {r.endDate}</td>
                  <td className="td">{r.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {dialog.open && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center">
          <div className="bg-white rounded-lg shadow p-6 max-w-sm w-full">
            <h2 className="text-lg font-semibold mb-2">{dialog.success? '완료':'실패'}</h2>
            <p className="mb-4" style={{whiteSpace:'pre-wrap'}}>{dialog.message}</p>
            <button className="btn-primary w-full" onClick={()=>setDialog({open:false})}>확인</button>
          </div>
        </div>
      )}
    </div>
  )
}