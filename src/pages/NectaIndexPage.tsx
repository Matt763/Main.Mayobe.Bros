import { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../lib/api';

interface SchoolRow {
  id: string;
  center_number: string;
  center_slug: string;
  school_name: string;
  total_students: number;
  summary: {
    div1: number;
    div2: number;
    div3: number;
    div4: number;
    div0: number;
    total?: { total: number };
  };
}

const SITE_TITLE = 'MAYOBE BROS';
const ALPHABET = ['ALL', 'A','B','C','D','E','F','G','H','I','J','K','L','M','N','O','P','Q','R','S','T','U','V','W','X','Y','Z'];

export default function NectaIndexPage() {
  const { year, examType } = useParams<{ year: string; examType: string }>();
  const navigate = useNavigate();
  const [schools, setSchools] = useState<SchoolRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [letter, setLetter] = useState('ALL');

  useEffect(() => {
    if (!year || !examType) return;
    setLoading(true);
    api.resultSchools.listByExam(parseInt(year), examType)
      .then(data => {
        if (!data || data.length === 0) { setNotFound(true); return; }
        setSchools(data);
        document.title = `Matokeo ${examType.toUpperCase()} ${year} | ${SITE_TITLE}`;
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [year, examType]);

  const filtered = useMemo(() => {
    if (letter === 'ALL') return schools;
    return schools.filter(s => s.school_name.toUpperCase().startsWith(letter));
  }, [schools, letter]);

  const examLabel = examType?.toUpperCase() ?? '';

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: '#ffffc0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ fontFamily: 'Arial, sans-serif', color: '#333' }}>Loading results...</p>
      </div>
    );
  }

  if (notFound) {
    return (
      <div style={{ minHeight: '100vh', background: '#ffffc0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center', fontFamily: 'Arial, sans-serif' }}>
          <h2 style={{ color: '#333' }}>Results Not Found</h2>
          <p style={{ color: '#666' }}>No schools found for {examLabel} {year}.</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#ffffc0', fontFamily: 'Arial, Helvetica, sans-serif', fontSize: '14px', color: '#000' }}>
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

      {/* Exam title bar */}
      <table width="100%" cellPadding={0} cellSpacing={0} style={{ background: '#003880', marginBottom: 0 }}>
        <tbody>
          <tr>
            <td style={{ padding: '6px 20px', textAlign: 'center' }}>
              <span style={{ color: '#fff', fontWeight: 'bold', fontSize: '14px' }}>
                {examLabel} {year} EXAMINATION RESULTS — INDEX OF SCHOOLS
              </span>
            </td>
          </tr>
        </tbody>
      </table>

      <div style={{ padding: '12px 20px' }}>
        {/* Stats row */}
        <table width="100%" cellPadding={0} cellSpacing={0} style={{ marginBottom: '10px' }}>
          <tbody>
            <tr>
              <td>
                <span style={{ fontWeight: 'bold' }}>{schools.length}</span> schools &nbsp;|&nbsp;
                <span style={{ fontWeight: 'bold' }}>{schools.reduce((sum, s) => sum + (s.total_students || 0), 0).toLocaleString()}</span> candidates
              </td>
            </tr>
          </tbody>
        </table>

        {/* Alphabet filter */}
        <div style={{ marginBottom: '12px', lineHeight: '2' }}>
          {ALPHABET.map(l => (
            <button
              key={l}
              onClick={() => setLetter(l)}
              style={{
                display: 'inline-block',
                margin: '2px 3px',
                padding: '2px 8px',
                border: '1px solid #003880',
                background: letter === l ? '#003880' : '#e8f0fe',
                color: letter === l ? '#fff' : '#003880',
                fontWeight: 'bold',
                fontSize: '12px',
                cursor: 'pointer',
                fontFamily: 'Arial, sans-serif',
              }}
            >
              {l}
            </button>
          ))}
        </div>

        {/* Schools table */}
        <table
          width="100%"
          cellPadding={3}
          cellSpacing={0}
          style={{ borderCollapse: 'collapse', border: '1px solid #003880', background: '#fff' }}
        >
          <thead>
            <tr style={{ background: '#003880', color: '#fff' }}>
              <th style={{ padding: '5px 8px', textAlign: 'left', border: '1px solid #aaa', width: '40px' }}>No.</th>
              <th style={{ padding: '5px 8px', textAlign: 'left', border: '1px solid #aaa', width: '90px' }}>Centre No.</th>
              <th style={{ padding: '5px 8px', textAlign: 'left', border: '1px solid #aaa' }}>School Name</th>
              <th style={{ padding: '5px 8px', textAlign: 'center', border: '1px solid #aaa', width: '55px' }}>Div I</th>
              <th style={{ padding: '5px 8px', textAlign: 'center', border: '1px solid #aaa', width: '55px' }}>Div II</th>
              <th style={{ padding: '5px 8px', textAlign: 'center', border: '1px solid #aaa', width: '55px' }}>Div III</th>
              <th style={{ padding: '5px 8px', textAlign: 'center', border: '1px solid #aaa', width: '55px' }}>Div IV</th>
              <th style={{ padding: '5px 8px', textAlign: 'center', border: '1px solid #aaa', width: '70px' }}>Abs/Fail</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={8} style={{ padding: '12px', textAlign: 'center', color: '#666' }}>
                  No schools found starting with "{letter}"
                </td>
              </tr>
            ) : (
              filtered.map((school, i) => (
                <tr
                  key={school.id}
                  style={{ background: i % 2 === 0 ? '#ffffc0' : '#e8f8e8', cursor: 'pointer' }}
                  onClick={() => navigate(`/matokeo/${year}/${examType}/${school.center_slug}`)}
                >
                  <td style={{ padding: '4px 8px', border: '1px solid #ddd' }}>{i + 1}</td>
                  <td style={{ padding: '4px 8px', border: '1px solid #ddd', fontFamily: 'monospace' }}>{school.center_number}</td>
                  <td style={{ padding: '4px 8px', border: '1px solid #ddd' }}>
                    <a
                      href={`/matokeo/${year}/${examType}/${school.center_slug}`}
                      onClick={e => { e.preventDefault(); navigate(`/matokeo/${year}/${examType}/${school.center_slug}`); }}
                      style={{ color: '#00008b', textDecoration: 'underline', fontWeight: 'bold' }}
                    >
                      {school.school_name}
                    </a>
                  </td>
                  <td style={{ padding: '4px 8px', border: '1px solid #ddd', textAlign: 'center' }}>{school.summary?.div1 ?? 0}</td>
                  <td style={{ padding: '4px 8px', border: '1px solid #ddd', textAlign: 'center' }}>{school.summary?.div2 ?? 0}</td>
                  <td style={{ padding: '4px 8px', border: '1px solid #ddd', textAlign: 'center' }}>{school.summary?.div3 ?? 0}</td>
                  <td style={{ padding: '4px 8px', border: '1px solid #ddd', textAlign: 'center' }}>{school.summary?.div4 ?? 0}</td>
                  <td style={{ padding: '4px 8px', border: '1px solid #ddd', textAlign: 'center' }}>{school.summary?.div0 ?? 0}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {/* Footer */}
        <div style={{ marginTop: '16px', textAlign: 'center', fontSize: '11px', color: '#555' }}>
          <a href="https://www.mayobebros.com" style={{ color: '#003880' }}>mayobebros.com</a>
          {' '}&mdash; Data sourced from NECTA Tanzania
        </div>
      </div>
    </div>
  );
}
