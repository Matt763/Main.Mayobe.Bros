import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../lib/api';

interface DivCount {
  div1: number;
  div2: number;
  div3: number;
  div4: number;
  div0: number;
  total: number;
}

interface SchoolSummary {
  div1: number;
  div2: number;
  div3: number;
  div4: number;
  div0: number;
  male?: DivCount;
  female?: DivCount;
  total?: DivCount;
}

interface Student {
  index_number: string;
  sex: string;
  aggregate: number | null;
  division: string;
  subjects: string;
}

interface SchoolData {
  id: string;
  year: number;
  exam_type: string;
  center_number: string;
  center_slug: string;
  school_name: string;
  summary: SchoolSummary;
  students: Student[];
  total_students: number;
}

function n(v: number | undefined) { return v ?? 0; }

function examFullName(examType: string, year: string | number): string {
  const map: Record<string, string> = {
    ftna:  `FORM TWO NATIONAL ASSESSMENT (FTNA) ${year} RESULTS`,
    csee:  `CERTIFICATE OF SECONDARY EDUCATION EXAMINATION (CSEE) ${year} RESULTS`,
    acsee: `ADVANCED CERTIFICATE OF SECONDARY EDUCATION EXAMINATION (ACSEE) ${year} RESULTS`,
    psle:  `PRIMARY SCHOOL LEAVING EXAMINATION (PSLE) ${year} RESULTS`,
  };
  return map[examType?.toLowerCase()] ?? `${examType?.toUpperCase()} ${year} RESULTS`;
}

export default function NectaSchoolPage() {
  const { year, examType, centerSlug } = useParams<{ year: string; examType: string; centerSlug: string }>();
  const navigate = useNavigate();
  const [school, setSchool] = useState<SchoolData | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!year || !examType || !centerSlug) return;
    setLoading(true);
    api.resultSchools.getSchool(parseInt(year), examType, centerSlug)
      .then(data => {
        if (!data) { setNotFound(true); return; }
        setSchool(data);
        document.title = `${data.school_name} | ${examType.toUpperCase()} ${year} | Mayobe Bros`;
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [year, examType, centerSlug]);

  const pageStyle: React.CSSProperties = {
    minHeight: '100vh',
    background: '#b3d9f5',
    fontFamily: 'Arial, Helvetica, sans-serif',
    fontSize: '13px',
    color: '#000',
    padding: '10px 16px',
  };

  if (loading) {
    return (
      <div style={pageStyle}>
        <b>NATIONAL EXAMINATIONS COUNCIL OF TANZANIA</b>
        <p>Loading school results...</p>
      </div>
    );
  }

  if (notFound || !school) {
    return (
      <div style={pageStyle}>
        <b>NATIONAL EXAMINATIONS COUNCIL OF TANZANIA</b>
        <p>School not found.</p>
        <a
          href={`/matokeo/${year}/${examType}`}
          onClick={e => { e.preventDefault(); navigate(`/matokeo/${year}/${examType}`); }}
          style={{ color: '#000099' }}
        >
          ← Back to Schools Index
        </a>
      </div>
    );
  }

  const sm = school.summary;
  const male   = sm.male   ?? { div1: 0, div2: 0, div3: 0, div4: 0, div0: 0, total: 0 };
  const female = sm.female ?? { div1: 0, div2: 0, div3: 0, div4: 0, div0: 0, total: 0 };
  const total  = sm.total  ?? {
    div1: sm.div1, div2: sm.div2, div3: sm.div3, div4: sm.div4, div0: sm.div0,
    total: sm.div1 + sm.div2 + sm.div3 + sm.div4 + sm.div0,
  };

  // Table shared styles
  const tbl: React.CSSProperties = { borderCollapse: 'collapse', fontSize: '12px' };
  const th: React.CSSProperties  = { border: '1px solid #666', padding: '2px 8px', background: '#d0d0d0', textAlign: 'center', fontWeight: 'bold' };
  const td: React.CSSProperties  = { border: '1px solid #999', padding: '2px 8px', textAlign: 'center' };
  const tdL: React.CSSProperties = { ...td, textAlign: 'left', fontWeight: 'bold', background: '#e0e0e0' };

  return (
    <div style={pageStyle}>
      {/* NECTA plain-text header */}
      <div style={{ marginBottom: '4px' }}>
        <b>NATIONAL EXAMINATIONS COUNCIL OF TANZANIA</b>
      </div>

      <h3 style={{ margin: '0 0 4px 0', fontSize: '15px', fontWeight: 'bold' }}>
        {examFullName(examType!, year!)}
      </h3>

      <h4 style={{ margin: '0 0 10px 0', fontSize: '13px', fontWeight: 'bold' }}>
        {school.center_number} - {school.school_name}
      </h4>

      {/* Back link */}
      <div style={{ marginBottom: '10px' }}>
        <a
          href={`/matokeo/${year}/${examType}`}
          onClick={e => { e.preventDefault(); navigate(`/matokeo/${year}/${examType}`); }}
          style={{ color: '#000099', fontSize: '12px' }}
        >
          ← Back to Schools Index
        </a>
      </div>

      {/* Division Performance Summary */}
      <div style={{ marginBottom: '4px', fontWeight: 'bold', fontSize: '12px' }}>
        DIVISION PERFORMANCE SUMMARY
      </div>
      <table style={{ ...tbl, marginBottom: '16px' }}>
        <thead>
          <tr>
            <th style={th}>SEX</th>
            <th style={th}>I</th>
            <th style={th}>II</th>
            <th style={th}>III</th>
            <th style={th}>IV</th>
            <th style={th}>0</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style={tdL}>F</td>
            <td style={td}>{n(female.div1)}</td>
            <td style={td}>{n(female.div2)}</td>
            <td style={td}>{n(female.div3)}</td>
            <td style={td}>{n(female.div4)}</td>
            <td style={td}>{n(female.div0)}</td>
          </tr>
          <tr>
            <td style={tdL}>M</td>
            <td style={td}>{n(male.div1)}</td>
            <td style={td}>{n(male.div2)}</td>
            <td style={td}>{n(male.div3)}</td>
            <td style={td}>{n(male.div4)}</td>
            <td style={td}>{n(male.div0)}</td>
          </tr>
          <tr>
            <td style={{ ...tdL, background: '#c0c0c0' }}>T</td>
            <td style={td}><b>{n(total.div1)}</b></td>
            <td style={td}><b>{n(total.div2)}</b></td>
            <td style={td}><b>{n(total.div3)}</b></td>
            <td style={td}><b>{n(total.div4)}</b></td>
            <td style={td}><b>{n(total.div0)}</b></td>
          </tr>
        </tbody>
      </table>

      {/* Student results table */}
      {school.students.length === 0 ? (
        <p style={{ color: '#666', fontSize: '12px' }}>No student data available.</p>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ ...tbl, width: '100%', minWidth: '700px' }}>
            <thead>
              <tr style={{ background: '#d0d0d0' }}>
                <th style={{ ...th, width: '100px' }}>CNO</th>
                <th style={{ ...th, width: '100px' }}>PReM NO</th>
                <th style={{ ...th, width: '40px' }}>SEX</th>
                <th style={{ ...th, width: '50px' }}>AGGT</th>
                <th style={{ ...th, width: '55px' }}>DIV</th>
                <th style={{ ...th, textAlign: 'left' }}>DETAILED SUBJECTS</th>
              </tr>
            </thead>
            <tbody>
              {school.students.map((s, i) => {
                const rowBg = i % 2 === 0 ? '#ffffc0' : '#b3d9f5';
                const tdR: React.CSSProperties = { border: '1px solid #ccc', padding: '2px 6px', background: rowBg, textAlign: 'center', fontSize: '12px' };
                const tdRS: React.CSSProperties = { ...tdR, textAlign: 'left', fontFamily: 'monospace' };
                return (
                  <tr key={s.index_number + i}>
                    <td style={{ ...tdR, fontFamily: 'monospace' }}>{s.index_number}</td>
                    <td style={{ ...tdR, fontFamily: 'monospace' }}>{s.index_number}</td>
                    <td style={tdR}>{s.sex}</td>
                    <td style={tdR}>{s.aggregate ?? 'ABS'}</td>
                    <td style={{ ...tdR, fontWeight: 'bold' }}>{s.division || 'ABS'}</td>
                    <td style={tdRS}>{s.subjects}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <div style={{ marginTop: '14px', fontSize: '11px', color: '#444' }}>
        Data via{' '}
        <a href="https://www.mayobebros.com" style={{ color: '#000099' }}>mayobebros.com</a>
        , sourced from NECTA Tanzania
      </div>
    </div>
  );
}
