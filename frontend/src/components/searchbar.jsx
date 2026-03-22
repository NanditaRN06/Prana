// frontend/components/SearchBar.jsx

import { useState } from "react";
import { Navigate } from "react-router-dom";
import { FaSearch, FaChevronRight } from 'react-icons/fa';
import axios from "axios";

const SearchBar = () => {
    const [inputChange, setInputChange] = useState("");
    const [searchResults, setSearchResults] = useState([]);
    const [rerouteTo, setRerouteTo] = useState(false);
    const [nameofPerson, setNameofPerson] = useState("");

    const handleInputChange = (e) => {
        const value = e.target.value;
        setInputChange(value);
        handleSearches(value);
    };

    const handleSearches = async (value) => {
        if (value.trim()) {
            try {
                const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/search-patients?query=${encodeURIComponent(value)}`, { withCredentials: true });
                setSearchResults(response.data);
            } catch (error) {
                console.error("Error searching patients:", error.message);
            }
        } else {
            setSearchResults([]);
        }
    };

    const handlePatientClick = (name) => {
        setRerouteTo(true);
        setNameofPerson(name);
    };

    if (rerouteTo) {
        return <Navigate to={`/patient/${encodeURIComponent(nameofPerson)}`} />;
    }

    return (
        <div className="relative w-full max-w-3xl mx-auto z-20">
            <div className="flex items-center bg-white border-2 border-slate-100 rounded-[2rem] px-8 py-5 shadow-2xl shadow-slate-200 focus-within:ring-8 focus-within:ring-blue-100 focus-within:border-blue-500 transition-all duration-300">
                <FaSearch className="text-slate-300 mr-6" size={24} />
                <input
                    type="text"
                    className="flex-1 bg-transparent outline-none text-slate-800 placeholder-slate-300 text-xl font-bold"
                    value={inputChange}
                    placeholder="Search Clinical Registry by Patient Name..."
                    onChange={handleInputChange}
                />
            </div>

            {inputChange && (
                <div className="absolute top-full left-0 right-0 mt-6 bg-white border border-slate-100 rounded-[2rem] shadow-2xl z-50 overflow-hidden animate-in slide-in-from-top-4 duration-300">
                    {searchResults.length > 0 ? (
                        <ul className="divide-y divide-slate-50">
                            {searchResults.map((result) => {
                                const getSnippet = (doc, term) => {
                                    if (!term) return null;
                                    const termLower = term.toLowerCase();

                                    const fields = [
                                        doc.name, doc.clinicalDiagnosis, doc.chiefComplaints, doc.examination, doc.phone, doc.address,
                                        ...(Array.isArray(doc.comorbidities) ? doc.comorbidities.map(c => typeof c === 'string' ? c : c.name) : []),
                                        ...(doc.investigationDetails?.mri?.map(i => i.region) || []),
                                        ...(doc.investigationDetails?.ct?.map(i => i.region) || []),
                                        ...(doc.investigationDetails?.enmg?.map(i => i.region) || []),
                                        doc.investigationDetails?.others
                                    ];

                                    for (const text of fields) {
                                        if (text && typeof text === 'string' && text.toLowerCase().includes(termLower)) {
                                            const words = text.split(/\s+/);
                                            const matchIndex = words.findIndex(w => w.toLowerCase().includes(termLower));
                                            if (matchIndex !== -1) {
                                                const start = Math.max(0, matchIndex - 2);
                                                const end = Math.min(words.length, matchIndex + 3);
                                                const chunk = words.slice(start, end).join(" ");
                                                return `...${chunk}...`;
                                            }
                                        }
                                    }
                                    return null;
                                };
                                const snippet = getSnippet(result, inputChange);
                                const highlightRegex = new RegExp(`(${inputChange.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');

                                return (
                                    <li
                                        key={result._id}
                                        className="px-8 py-6 hover:bg-slate-50 cursor-pointer group transition-all"
                                        onClick={() => handlePatientClick(result.name)}
                                    >
                                        <div className="flex justify-between items-center">
                                            <div className="space-y-1">
                                                <span className="text-lg font-black text-slate-800 group-hover:text-blue-600 transition-colors">
                                                    {result.name}
                                                </span>
                                                {snippet && (
                                                    <span className="block text-xs text-slate-500 font-medium mt-1">
                                                        Match: <span className="bg-yellow-100 text-slate-800 px-1 rounded">
                                                            {snippet.split(highlightRegex).map((part, i) =>
                                                                part.toLowerCase() === inputChange.toLowerCase() ? (
                                                                    <span key={i} className="font-bold underline">{part}</span>
                                                                ) : (
                                                                    part
                                                                )
                                                            )}
                                                        </span>
                                                    </span>
                                                )}
                                                <div className="flex gap-4 items-center mt-1">
                                                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Registry ID: {result._id.slice(-8).toUpperCase()}</span>
                                                    <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
                                                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{result.age} Years</span>
                                                </div>
                                            </div>
                                            <FaChevronRight className="text-slate-200 group-hover:text-blue-400 group-hover:translate-x-1 transition-all" />
                                        </div>
                                    </li>
                                )
                            })}
                        </ul>
                    ) : (
                        <div className="px-10 py-16 text-center space-y-4">
                            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto">
                                <FaSearch className="text-slate-200" size={24} />
                            </div>
                            <div className="space-y-1">
                                <h4 className="text-slate-800 font-black">No Registry Matches</h4>
                                <p className="text-slate-400 text-sm font-medium">Unable to locate records for "{inputChange}"</p>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default SearchBar;
