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

const SITE_TITLE = 'MAYOBE BROS';

function divLabel(n: number | undefined) {
  return n ?? 0;
}

function SummaryTable({ summary }: { summary: SchoolSummary }) {
  const m = summary.male   ?? { div1: 0, div2: 0, div3: 0, div4: 0, div0: 0, total: 0 };
  const f = summary.female ?? { div1: 0, div2: 0, div3: 0, div4: 0, div0: 0, total: 0 };
  const t = summary.total  ?? {
    div1: summary.div1, div2: summary.div2, div3: summary.div3,
    div4: summary.div4, div0: summary.div0,
    total: summary.div1 + summary.div2 + summary.div3 + summary.div4 + summary.div0,
  };

  const thStyle: React.CSSProperties = {
    padding: '4px 8px', border: '1px solid #555', background: '#003880',
    color: '#fff', textAlign: 'center', fontSize: '12px',
  };
  const tdStyle: React.CSSProperties = {
    padding: '4px 8px', border: '1px solid #999', textAlign: 'center', fontSize: '13px',
  };
  const tdLabelStyle: React.CSSProperties = {
    ...tdStyle, fontWeight: 'bold', background: '#d0e8f8', textAlign: 'left',
  };

  return (
    <table cellPadding={0} cellSpacing={0} style={{ borderCollapse: 'collapse', marginBottom: '16px' }}>
      <thead>
        <tr>
          <th style={thStyle}>SEX</th>
          <th style={thStyle}>DIV I</th>
          <th style={thStyle}>DIV II</th>
          <th style={thStyle}>DIV III</th>
          <th style={thStyle}>DIV IV</th>
          <th style={thStyle}>DIV 0</th>
          <th style={thStyle}>TOTAL</th>
        </tr>
      </thead>
      <tbody>
        <tr style={{ background: '#ffffc0' }}>
          <td style={tdLabelStyle}>MALE</td>
          <td style={tdStyle}>{divLabel(m.div1)}</td>
          <td style={tdStyle}>{divLabel(m.div2)}</td>
          <td style={tdStyle}>{divLabel(m.div3)}</td>
          <td style={tdStyle}>{divLabel(m.div4)}</td>
          <td style={tdStyle}>{divLabel(m.div0)}</td>
          <td style={tdStyle}><strong>{divLabel(m.total)}</strong></td>
        </tr>
        <tr style={{ background: '#e8f8ff' }}>
          <td style={tdLabelStyle}>FEMALE</td>
          <td style={tdStyle}>{divLabel(f.div1)}</td>
          <td style={tdStyle}>{divLabel(f.div2)}</td>
          <td style={tdStyle}>{divLabel(f.div3)}</td>
          <td style={tdStyle}>{divLabel(f.div4)}</td>
          <td style={tdStyle}>{divLabel(f.div0)}</td>
          <td style={tdStyle}><strong>{divLabel(f.total)}</strong></td>
        </tr>
        <tr style={{ background: '#d4edda' }}>
          <td style={{ ...tdLabelStyle, background: '#b8dfc5' }}>TOTAL</td>
          <td style={tdStyle}><strong>{divLabel(t.div1)}</strong></td>
          <td style={tdStyle}><strong>{divLabel(t.div2)}</strong></td>
          <td style={tdStyle}><strong>{divLabel(t.div3)}</strong></td>
          <td style={tdStyle}><strong>{divLabel(t.div4)}</strong></td>
          <td style={tdStyle}><strong>{divLabel(t.div0)}</strong></td>
          <td style={tdStyle}><strong>{divLabel(t.total)}</strong></td>
        </tr>
      </tbody>
    </table>
  );
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
        document.title = `${data.school_name} — ${examType.toUpperCase()} ${year} | ${SITE_TITLE}`;
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [year, examType, centerSlug]);

  const examLabel = examType?.toUpperCase() ?? '';

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: '#b3d9f5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ fontFamily: 'Arial, sans-serif', color: '#003880' }}>Loading school results...</p>
      </div>
    );
  }

  if (notFound || !school) {
    return (
      <div style={{ minHeight: '100vh', background: '#b3d9f5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center', fontFamily: 'Arial, sans-serif' }}>
          <h2 style={{ color: '#003880' }}>School Not Found</h2>
          <p style={{ color: '#333' }}>No results found for this school.</p>
          <button
            onClick={() => navigate(`/matokeo/${year}/${examType}`)}
            style={{ marginTop: '12px', padding: '8px 20px', background: '#003880', color: '#fff', border: 'none', cursor: 'pointer', fontFamily: 'Arial, sans-serif' }}
          >
            ← Back to Schools List
          </button>
        </div>
      </div>
    );
  }

  const thStyle: React.CSSProperties = {
    padding: '4px 8px', border: '1px solid #555', background: '#003880',
    color: '#fff', textAlign: 'center', fontSize: '12px', whiteSpace: 'nowrap',
  };

  return (
    <div style={{ minHeight: '100vh', background: '#b3d9f5', fontFamily: 'Arial, Helvetica, sans-serif', fontSize: '14px', color: '#000' }}>
      {/* NECTA-style top header */}
      <table width="100%" cellPadding={0} cellSpacing={0} style={{ background: 'linear-gradient(180deg,#003880 0%,#001f5c 100%)', marginBottom: 0 }}>
        <tbody>
          <tr>
            <td style={{ padding: '10px 20px', textAlign: 'center' }}>
              <div style={{ color: '#fff', fontSize: '11px', letterSpacing: '1px', opacity: 0.8 }}>UNITED REPUBLIC OF TANZANIA</div>
              <div style={{ color: '#ffd700', fontSize: '18px', fontWeight: 'bold', margin: '2px 0' }}>
                NATIONAL EXAMINATIONS COUNCIL OF TANZANIA
              </div>
              <div style={{ color: '#fff', fontSize: '11px', letterSpacing: '0.5px', opacity: 0.8 }}>VIA MAYOBE BROS</div>
            </td>
          </tr>
        </tbody>
      </table>

      {/* Exam + school title bar */}
      <table width="100%" cellPadding={0} cellSpacing={0} style={{ background: '#003880', marginBottom: 0 }}>
        <tbody>
          <tr>
            <td style={{ padding: '6px 20px', textAlign: 'center' }}>
              <div style={{ color: '#fff', fontWeight: 'bold', fontSize: '14px' }}>
                {examLabel} {year} EXAMINATION RESULTS
              </div>
              <div style={{ color: '#ffd700', fontSize: '13px', marginTop: '2px' }}>
                {school.school_name} ({school.center_number})
              </div>
            </td>
          </tr>
        </tbody>
      </table>

      <div style={{ padding: '14px 20px' }}>
        {/* Back button */}
        <button
          onClick={() => navigate(`/matokeo/${year}/${examType}`)}
          style={{
            marginBottom: '14px', padding: '5px 14px', background: '#003880', color: '#fff',
            border: 'none', cursor: 'pointer', fontFamily: 'Arial, sans-serif', fontSize: '13px',
          }}
        >
          ← Back to Schools List
        </button>

        {/* Division Performance Summary */}
        <div style={{ marginBottom: '6px', fontWeight: 'bold', fontSize: '13px', textTransform: 'uppercase', color: '#003880' }}>
          Division Performance Summary
        </div>
        <SummaryTable summary={school.summary} />

        {/* Student results table */}
        <div style={{ marginBottom: '6px', fontWeight: 'bold', fontSize: '13px', textTransform: 'uppercase', color: '#003880' }}>
          Candidates Results — {school.total_students} Candidates
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table
            width="100%"
            cellPadding={0}
            cellSpacing={0}
            style={{ borderCollapse: 'collapse', border: '1px solid #555', background: '#fff', minWidth: '700px' }}
          >
            <thead>
              <tr>
                <th style={{ ...thStyle, width: '110px' }}>CNO</th>
                <th style={{ ...thStyle, width: '110px' }}>PREM NO</th>
                <th style={{ ...thStyle, width: '50px' }}>SEX</th>
                <th style={{ ...thStyle, width: '55px' }}>AGGT</th>
                <th style={{ ...thStyle, width: '55px' }}>DIV</th>
                <th style={{ ...thStyle }}>DETAILED SUBJECTS</th>
              </tr>
            </thead>
            <tbody>
              {school.students.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ padding: '12px', textAlign: 'center', color: '#666' }}>
                    No student data available.
                  </td>
                </tr>
              ) : (
                school.students.map((s, i) => (
                  <tr
                    key={s.index_number + i}
                    style={{ background: i % 2 === 0 ? '#ffffc0' : '#e8f0ff' }}
                  >
                    <td style={{ padding: '3px 8px', border: '1px solid #ccc', fontFamily: 'monospace', fontSize: '12px' }}>
                      {s.index_number}
                    </td>
                    <td style={{ padding: '3px 8px', border: '1px solid #ccc', fontFamily: 'monospace', fontSize: '12px' }}>
                      {s.index_number}
                    </td>
                    <td style={{ padding: '3px 8px', border: '1px solid #ccc', textAlign: 'center' }}>{s.sex}</td>
                    <td style={{ padding: '3px 8px', border: '1px solid #ccc', textAlign: 'center' }}>{s.aggregate ?? '-'}</td>
                    <td style={{ padding: '3px 8px', border: '1px solid #ccc', textAlign: 'center', fontWeight: 'bold' }}>
                      {s.division}
                    </td>
                    <td style={{ padding: '3px 8px', border: '1px solid #ccc', fontFamily: 'monospace', fontSize: '11px', wordBreak: 'break-word' }}>
                      {s.subjects}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div style={{ marginTop: '16px', textAlign: 'center', fontSize: '11px', color: '#444' }}>
          <a href="https://www.mayobebros.com" style={{ color: '#003880' }}>mayobebros.com</a>
          {' '}&mdash; Data sourced from NECTA Tanzania
        </div>
      </div>
    </div>
  );
}
