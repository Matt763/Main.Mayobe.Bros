import { useEffect, useState, useMemo, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../lib/api';

interface SchoolRow {
  id: string;
  center_number: string;
  center_slug: string;
  school_name: string;
}

const ALPHABET = ['ALL','A','B','C','D','E','F','G','H','I','J','K','L','M','N','O','P','Q','R','S','T','U','V','W','X','Y','Z'];
const CELL_COLORS = ['#ffcccc','#ccccff','#ccffcc','#ffe0b3'];

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
  const navigate            = useNavigate();

  const [schools, setSchools]   = useState<SchoolRow[]>([]);
  const [loading, setLoading]   = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [letter, setLetter]     = useState('ALL');
  const [query, setQuery]       = useState('');
  const [suggestions, setSuggestions] = useState<SchoolRow[]>([]);
  const [showDrop, setShowDrop] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  // Isolate page from site-wide dark mode / theme
  useEffect(() => {
    const prevBodyBg  = document.body.style.background;
    const prevBodyMin = document.body.style.minHeight;
    const prevHtmlBg  = document.documentElement.style.background;
    document.body.style.background  = '#ffffc0';
    document.body.style.minHeight   = '100vh';
    document.documentElement.style.background = '#ffffc0';
    return () => {
      document.body.style.background  = prevBodyBg;
      document.body.style.minHeight   = prevBodyMin;
      document.documentElement.style.background = prevHtmlBg;
    };
  }, []);

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

  // Live search suggestions
  useEffect(() => {
    const q = query.trim().toLowerCase();
    if (q.length < 2) { setSuggestions([]); setShowDrop(false); return; }
    const matches = schools.filter(s => s.school_name.toLowerCase().includes(q)).slice(0, 12);
    setSuggestions(matches);
    setShowDrop(matches.length > 0);
  }, [query, schools]);

  // Close dropdown on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowDrop(false);
      }
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (q.length >= 2) return schools.filter(s => s.school_name.toLowerCase().includes(q));
    if (letter !== 'ALL') return schools.filter(s => s.school_name.toUpperCase().startsWith(letter));
    return schools;
  }, [schools, letter, query]);

  // Build rows of 4
  const rows: SchoolRow[][] = [];
  for (let i = 0; i < filtered.length; i += 4) rows.push(filtered.slice(i, i + 4));

  const page: React.CSSProperties = {
    minHeight: '100vh',
    background: '#ffffc0',
    fontFamily: 'Arial, Helvetica, sans-serif',
    fontSize: '13px',
    color: '#000',
    padding: '10px 14px',
  };

  if (loading) return <div style={page}><b>NATIONAL EXAMINATIONS COUNCIL OF TANZANIA</b><p>Loading...</p></div>;
  if (notFound) return (
    <div style={page}>
      <b>NATIONAL EXAMINATIONS COUNCIL OF TANZANIA</b>
      <p>No results found for {examType?.toUpperCase()} {year}. Please crawl this exam first via the admin panel.</p>
    </div>
  );

  return (
    <div style={page}>
      {/* NECTA plain-text header */}
      <div style={{ marginBottom: '4px', fontSize: '13px' }}>
        <b>NATIONAL EXAMINATIONS COUNCIL OF TANZANIA</b>
      </div>

      <h3 style={{ margin: '0 0 10px 0', fontSize: '15px', fontWeight: 'bold' }}>
        {examFullName(examType!, year!)} ENQUIRIES &mdash; INDEX
        {letter !== 'ALL' && !query ? ` - ${letter}` : ''}
      </h3>

      {/* Live search */}
      <div ref={searchRef} style={{ position: 'relative', marginBottom: '10px', maxWidth: '480px' }}>
        <input
          type="text"
          value={query}
          onChange={e => { setQuery(e.target.value); setLetter('ALL'); }}
          placeholder="Search school name..."
          style={{
            width: '100%',
            padding: '6px 10px',
            fontSize: '13px',
            border: '1px solid #999',
            background: '#fff',
            color: '#000',
            outline: 'none',
            boxSizing: 'border-box',
          }}
        />
        {showDrop && (
          <div style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            background: '#fff',
            border: '1px solid #999',
            borderTop: 'none',
            zIndex: 100,
            maxHeight: '260px',
            overflowY: 'auto',
          }}>
            {suggestions.map(s => (
              <div
                key={s.id}
                onMouseDown={() => {
                  setShowDrop(false);
                  navigate(`/matokeo/${year}/${examType}/${s.center_slug}`);
                }}
                style={{
                  padding: '5px 10px',
                  cursor: 'pointer',
                  borderBottom: '1px solid #eee',
                  fontSize: '12px',
                  color: '#000',
                }}
                onMouseEnter={e => (e.currentTarget.style.background = '#e8f0fe')}
                onMouseLeave={e => (e.currentTarget.style.background = '#fff')}
              >
                <span style={{ color: '#000099', fontWeight: 'bold' }}>{s.school_name}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Alphabet filter */}
      <div style={{ marginBottom: '4px', fontSize: '11px', color: '#555' }}>
        CLICK ANY LETTER BELOW TO FILTER CENTRES BY ALPHABET
      </div>
      <div style={{ marginBottom: '12px', lineHeight: '1.8' }}>
        {ALPHABET.map((l, i) => (
          <span key={l}>
            {i > 0 && <span style={{ color: '#aaa', margin: '0 2px' }}>|</span>}
            <a
              href="#"
              onClick={e => { e.preventDefault(); setLetter(l); setQuery(''); }}
              style={{
                color: letter === l && !query ? '#cc0000' : '#000099',
                fontWeight: letter === l && !query ? 'bold' : 'normal',
                textDecoration: 'none',
                fontSize: '12px',
              }}
            >
              {l === 'ALL' ? 'ALL CENTRES' : l}
            </a>
          </span>
        ))}
      </div>

      {/* Count */}
      <div style={{ marginBottom: '8px', fontSize: '12px', color: '#333' }}>
        {filtered.length} centre{filtered.length !== 1 ? 's' : ''} found
        {query && <span style={{ color: '#cc0000' }}> for &ldquo;{query}&rdquo;</span>}
      </div>

      {/* 4-column school grid — school names only, no centre numbers, no division data */}
      {filtered.length === 0 ? (
        <p style={{ color: '#666' }}>No schools match your search.</p>
      ) : (
        <table cellPadding={0} cellSpacing={1} style={{ borderCollapse: 'separate', width: '100%', background: '#888' }}>
          <tbody>
            {rows.map((row, ri) => (
              <tr key={ri}>
                {row.map((school, ci) => (
                  <td
                    key={school.id}
                    style={{
                      background: CELL_COLORS[ci % 4],
                      padding: '4px 7px',
                      width: '25%',
                      verticalAlign: 'top',
                      cursor: 'pointer',
                    }}
                    onClick={() => navigate(`/matokeo/${year}/${examType}/${school.center_slug}`)}
                  >
                    <a
                      href={`/matokeo/${year}/${examType}/${school.center_slug}`}
                      onClick={e => e.preventDefault()}
                      style={{ color: '#000099', textDecoration: 'none', fontSize: '12px' }}
                    >
                      {school.school_name}
                    </a>
                  </td>
                ))}
                {row.length < 4 && Array.from({ length: 4 - row.length }).map((_, ei) => (
                  <td key={'e' + ei} style={{ background: '#ffffc0', width: '25%' }} />
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <div style={{ marginTop: '14px', fontSize: '11px', color: '#666' }}>
        {schools.length} total centres &mdash; Data via{' '}
        <a href="https://www.mayobebros.com" style={{ color: '#000099' }}>mayobebros.com</a>
        , sourced from NECTA Tanzania
      </div>
    </div>
  );
}
