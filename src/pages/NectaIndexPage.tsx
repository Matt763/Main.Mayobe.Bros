import { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../lib/api';

interface SchoolRow {
  id: string;
  center_number: string;
  center_slug: string;
  school_name: string;
  total_students: number;
}

const ALPHABET = ['ALL CENTRES','A','B','C','D','E','F','G','H','I','J','K','L','M','N','O','P','Q','R','S','T','U','V','W','X','Y','Z'];

// Cycle of 3 column colors matching NECTA's style
const COL_COLORS = ['#ff9999', '#9999ff', '#99ff99'];

function examFullName(examType: string, year: string | number): string {
  const map: Record<string, string> = {
    ftna:  `FORM TWO NATIONAL ASSESSMENT (FTNA) ${year} RESULTS`,
    csee:  `CERTIFICATE OF SECONDARY EDUCATION EXAMINATION (CSEE) ${year} RESULTS`,
    acsee: `ADVANCED CERTIFICATE OF SECONDARY EDUCATION EXAMINATION (ACSEE) ${year} RESULTS`,
    psle:  `PRIMARY SCHOOL LEAVING EXAMINATION (PSLE) ${year} RESULTS`,
  };
  return map[examType?.toLowerCase()] ?? `${examType?.toUpperCase()} ${year} RESULTS`;
}

export default function NectaIndexPage() {
  const { year, examType } = useParams<{ year: string; examType: string }>();
  const navigate = useNavigate();
  const [schools, setSchools] = useState<SchoolRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [letter, setLetter] = useState('ALL CENTRES');

  useEffect(() => {
    if (!year || !examType) return;
    setLoading(true);
    api.resultSchools.listByExam(parseInt(year), examType)
      .then(data => {
        if (!data || data.length === 0) { setNotFound(true); return; }
        setSchools(data);
        document.title = `Matokeo ${examType.toUpperCase()} ${year} | NECTA | Mayobe Bros`;
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [year, examType]);

  const filtered = useMemo(() => {
    if (letter === 'ALL CENTRES') return schools;
    return schools.filter(s => s.school_name.toUpperCase().startsWith(letter));
  }, [schools, letter]);

  // Build rows of 3 for the grid
  const rows: SchoolRow[][] = [];
  for (let i = 0; i < filtered.length; i += 3) {
    rows.push(filtered.slice(i, i + 3));
  }

  const pageStyle: React.CSSProperties = {
    minHeight: '100vh',
    background: '#ffffc0',
    fontFamily: 'Arial, Helvetica, sans-serif',
    fontSize: '13px',
    color: '#000',
    padding: '10px 16px',
  };

  if (loading) {
    return (
      <div style={pageStyle}>
        <b>NATIONAL EXAMINATIONS COUNCIL OF TANZANIA</b>
        <p>Loading results, please wait...</p>
      </div>
    );
  }

  if (notFound) {
    return (
      <div style={pageStyle}>
        <b>NATIONAL EXAMINATIONS COUNCIL OF TANZANIA</b>
        <p>No results found for {examType?.toUpperCase()} {year}.</p>
        <p>Please ensure the data has been crawled using the admin AI Results Assistant.</p>
      </div>
    );
  }

  return (
    <div style={pageStyle}>
      {/* NECTA plain-text header — exactly like necta.go.tz */}
      <div style={{ marginBottom: '6px' }}>
        <b>NATIONAL EXAMINATIONS COUNCIL OF TANZANIA</b>
      </div>

      <h3 style={{ margin: '0 0 6px 0', fontSize: '16px', fontWeight: 'bold' }}>
        {examFullName(examType!, year!)} ENQUIRIES &mdash; INDEX
        {letter !== 'ALL CENTRES' ? ` - ${letter}` : ''}
      </h3>

      {/* Alphabet filter */}
      <div style={{ marginBottom: '10px', fontSize: '12px' }}>
        CLICK ANY LETTER BELOW TO FILTER CENTRES BY ALPHABET
      </div>
      <div style={{ marginBottom: '12px' }}>
        {ALPHABET.map((l, i) => (
          <span key={l}>
            {i > 0 && <span style={{ color: '#555', margin: '0 2px' }}>|</span>}
            <a
              href="#"
              onClick={e => { e.preventDefault(); setLetter(l); }}
              style={{
                color: letter === l ? '#cc0000' : '#000099',
                fontWeight: letter === l ? 'bold' : 'normal',
                textDecoration: 'none',
                fontSize: '13px',
              }}
            >
              {l}
            </a>
          </span>
        ))}
      </div>

      {/* 3-column school grid */}
      {filtered.length === 0 ? (
        <p>No schools found starting with &quot;{letter}&quot;.</p>
      ) : (
        <table cellPadding={3} cellSpacing={1} style={{ borderCollapse: 'separate', width: '100%', background: '#ccc' }}>
          <tbody>
            {rows.map((row, ri) => (
              <tr key={ri}>
                {row.map((school, ci) => (
                  <td
                    key={school.id}
                    style={{
                      background: COL_COLORS[ci % 3],
                      padding: '4px 6px',
                      width: '33.33%',
                      verticalAlign: 'top',
                    }}
                  >
                    <a
                      href={`/matokeo/${year}/${examType}/${school.center_slug}`}
                      onClick={e => { e.preventDefault(); navigate(`/matokeo/${year}/${examType}/${school.center_slug}`); }}
                      style={{ color: '#000099', textDecoration: 'none', fontSize: '12px' }}
                    >
                      {school.school_name}
                    </a>
                  </td>
                ))}
                {/* Fill empty cells in last row */}
                {row.length < 3 && Array.from({ length: 3 - row.length }).map((_, ei) => (
                  <td key={'empty-' + ei} style={{ background: '#ffffc0', width: '33.33%' }} />
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <div style={{ marginTop: '14px', fontSize: '11px', color: '#555' }}>
        {schools.length} centres &mdash; Data via{' '}
        <a href="https://www.mayobebros.com" style={{ color: '#000099' }}>mayobebros.com</a>
        , sourced from NECTA Tanzania
      </div>
    </div>
  );
}
