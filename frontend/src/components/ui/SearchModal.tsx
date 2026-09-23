import React, { useState, useEffect } from 'react';
import { Search, BookOpen, User, Building, Calendar, ArrowRight, X } from 'lucide-react';
import { subjectService, facultyService, roomService, timetableService } from '../../services/api';
import { useNavigate } from 'react-router-dom';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SearchModal: React.FC<SearchModalProps> = ({ isOpen, onClose }) => {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<{
    subjects: any[];
    faculty: any[];
    rooms: any[];
  }>({ subjects: [], faculty: [], rooms: [] });

  const navigate = useNavigate();

  useEffect(() => {
    if (!isOpen) {
      setQuery('');
      setResults({ subjects: [], faculty: [], rooms: [] });
      return;
    }
  }, [isOpen]);

  useEffect(() => {
    if (!query.trim()) {
      setResults({ subjects: [], faculty: [], rooms: [] });
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const [subs, facs, rms] = await Promise.all([
          subjectService.getAll({ search: query }),
          facultyService.getAll({ search: query }),
          roomService.getAll({ search: query })
        ]);
        setResults({
          subjects: subs.data?.slice(0, 4) || [],
          faculty: facs.data?.slice(0, 4) || [],
          rooms: rms.data?.slice(0, 4) || []
        });
      } catch (err) {
        console.error('Search error:', err);
      } finally {
        setLoading(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [query]);

  if (!isOpen) return null;

  const totalResults = results.subjects.length + results.faculty.length + results.rooms.length;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto no-print">
      <div
        className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
        onClick={onClose}
      />

      <div className="flex min-h-full items-start justify-center p-4 pt-16 text-center sm:p-0 sm:pt-20">
        <div
          className="relative w-full max-w-xl transform overflow-hidden rounded-2xl bg-white text-left align-middle shadow-modal transition-all border border-border animate-in zoom-in-95 duration-200"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Search Header */}
          <div className="flex items-center px-4 py-3.5 border-b border-border gap-3">
            <Search className="w-5 h-5 text-slate-400" />
            <input
              autoFocus
              type="text"
              placeholder="Search subjects, faculty, rooms, course codes..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full bg-transparent text-sm text-slate-900 placeholder-slate-400 focus:outline-none"
            />
            {query && (
              <button
                onClick={() => setQuery('')}
                className="text-slate-400 hover:text-slate-600 p-1 rounded"
              >
                <X className="w-4 h-4" />
              </button>
            )}
            <kbd className="hidden sm:inline-block px-2 py-0.5 text-[10px] font-semibold text-slate-400 bg-slate-100 border border-slate-200 rounded">
              ESC
            </kbd>
          </div>

          {/* Search Body */}
          <div className="max-h-96 overflow-y-auto p-4">
            {loading ? (
              <div className="py-8 text-center text-xs text-slate-500">Searching SCHEDURA database...</div>
            ) : query.trim() && totalResults === 0 ? (
              <div className="py-8 text-center text-xs text-slate-500">No results found for "{query}"</div>
            ) : !query.trim() ? (
              <div className="py-6 text-center text-xs text-slate-400">
                Type to search subjects, faculty members, lecture halls, and laboratory rooms.
              </div>
            ) : (
              <div className="space-y-4">
                {results.subjects.length > 0 && (
                  <div>
                    <h5 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">Subjects</h5>
                    <div className="space-y-1">
                      {results.subjects.map((s) => (
                        <div
                          key={s._id}
                          className="flex items-center justify-between p-2.5 rounded-lg hover:bg-slate-50 transition cursor-pointer group"
                          onClick={() => {
                            onClose();
                          }}
                        >
                          <div className="flex items-center gap-2.5">
                            <div className="p-1.5 rounded-md bg-blue-50 text-brand-600">
                              <BookOpen className="w-4 h-4" />
                            </div>
                            <div>
                              <div className="text-xs font-semibold text-slate-900">{s.subjectName}</div>
                              <div className="text-[11px] text-slate-500">{s.subjectCode} • {s.departmentId?.name || 'Department'} (Sem {s.semester})</div>
                            </div>
                          </div>
                          <span className="text-[11px] text-slate-400 font-medium">{s.credits} Credits</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {results.faculty.length > 0 && (
                  <div>
                    <h5 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">Faculty</h5>
                    <div className="space-y-1">
                      {results.faculty.map((f) => (
                        <div
                          key={f._id}
                          className="flex items-center justify-between p-2.5 rounded-lg hover:bg-slate-50 transition cursor-pointer"
                          onClick={() => {
                            onClose();
                          }}
                        >
                          <div className="flex items-center gap-2.5">
                            <div className="p-1.5 rounded-md bg-emerald-50 text-emerald-600">
                              <User className="w-4 h-4" />
                            </div>
                            <div>
                              <div className="text-xs font-semibold text-slate-900">{f.name}</div>
                              <div className="text-[11px] text-slate-500">{f.designation} • {f.departmentId?.name || 'Department'}</div>
                            </div>
                          </div>
                          <span className="text-[11px] text-slate-400 font-mono">{f.facultyId}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {results.rooms.length > 0 && (
                  <div>
                    <h5 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">Rooms & Labs</h5>
                    <div className="space-y-1">
                      {results.rooms.map((r) => (
                        <div
                          key={r._id}
                          className="flex items-center justify-between p-2.5 rounded-lg hover:bg-slate-50 transition cursor-pointer"
                          onClick={() => {
                            onClose();
                          }}
                        >
                          <div className="flex items-center gap-2.5">
                            <div className="p-1.5 rounded-md bg-purple-50 text-purple-600">
                              <Building className="w-4 h-4" />
                            </div>
                            <div>
                              <div className="text-xs font-semibold text-slate-900">{r.roomNumber} ({r.roomType})</div>
                              <div className="text-[11px] text-slate-500">{r.building} • Floor {r.floor}</div>
                            </div>
                          </div>
                          <span className="text-[11px] text-slate-400">Cap: {r.capacity}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
