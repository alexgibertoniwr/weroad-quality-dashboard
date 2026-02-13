import React, { useState, useMemo } from 'react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { ChevronDown, TrendingDown, TrendingUp, AlertCircle, CheckCircle, BarChart3, Flag, Target, FileText, Map } from 'lucide-react';

// Types
type ProductLine = 'WR' | 'WRX';
type Severity = 'LOW' | 'MEDIUM' | 'HIGH';
type Period = 'Week' | 'Month' | 'Quarter';
type Grain = 'Destination' | 'Itinerary';

interface Destination {
  id: string;
  name: string;
  country: string;
}

interface Itinerary {
  id: string;
  name: string;
  destinationId: string;
}

interface Tour {
  id: string;
  itineraryId: string;
  startDate: string;
  endDate: string;
  productLine: ProductLine;
  dmcName: string;
  coordinatorName: string;
}

interface SurveyResponse {
  id: string;
  tourId: string;
  createdAt: string;
  scores: {
    overall: number;
    qp: number;
    accommodation: number;
    logistics: number;
    preDepartureInfo: number;
    coordinatorCourtesy: number;
    coordinatorLeadership: number;
    coordinatorOrganisation: number;
  };
  comments: {
    general: string;
    accommodationBad: string;
    logistics: string;
    coordinator: string;
  };
  domain: string;
}

interface Annotation {
  responseId: string;
  tags: {
    productTags: string[];
    coordinatorTags: string[];
  };
  severity: Severity;
  confidence: number;
  evidenceSnippets: string[];
}

interface SuggestedAction {
  id: string;
  destinationId: string;
  itineraryId?: string;
  issueTag: string;
  actionType: 'DMC_CHANGE' | 'COORDINATOR_TRAINING' | 'ITINERARY_ADJUSTMENT' | 'ACCOMMODATION_UPGRADE' | 'SUPPLIER_REVIEW' | 'PROCESS_IMPROVEMENT';
  description: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  status: 'SUGGESTED' | 'PLANNED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  createdAt: string;
  dueDate: string;
  owner: string;
  affectedTours: number;
}

interface CorrectiveAction {
  id: string;
  suggestedActionId?: string;
  destinationId: string;
  itineraryId?: string;
  issueTag: string;
  actionTaken: string;
  implementedAt: string;
  owner: string;
  notes: string;
  impactMetrics: {
    avgScoreBefore: number;
    avgScoreAfter: number;
    pctBelow8Before: number;
    pctBelow8After: number;
    toursBeforeAction: number;
    toursAfterAction: number;
  };
}

// Fake Data
const destinations: Destination[] = [
  { id: 'd1', name: 'Bali', country: 'Indonesia' },
  { id: 'd2', name: 'Iceland', country: 'Iceland' },
  { id: 'd3', name: 'Jordan', country: 'Jordan' },
  { id: 'd4', name: 'Morocco', country: 'Morocco' },
  { id: 'd5', name: 'Peru', country: 'Peru' },
  { id: 'd6', name: 'Croatia', country: 'Croatia' },
];

const itineraries: Itinerary[] = [
  { id: 'i1', name: 'Bali Beach & Culture', destinationId: 'd1' },
  { id: 'i2', name: 'Bali Adventure Trek', destinationId: 'd1' },
  { id: 'i3', name: 'Iceland Ring Road', destinationId: 'd2' },
  { id: 'i4', name: 'Iceland Northern Lights', destinationId: 'd2' },
  { id: 'i5', name: 'Jordan Desert Explorer', destinationId: 'd3' },
  { id: 'i6', name: 'Morocco Imperial Cities', destinationId: 'd4' },
  { id: 'i7', name: 'Morocco Sahara Trek', destinationId: 'd4' },
  { id: 'i8', name: 'Peru Inca Trail', destinationId: 'd5' },
  { id: 'i9', name: 'Croatia Island Hopping', destinationId: 'd6' },
];

const dmcs = ['Adventure DMC', 'Local Connect', 'Global Tours', 'Premium Travel', 'Explore More'];
const coordinators = ['Sarah M.', 'Marco R.', 'Lisa K.', 'Ahmed B.', 'Emma T.', 'Paolo G.', 'Sofia L.', 'David W.'];

const generateTours = (): Tour[] => {
  const tours: Tour[] = [];
  const startDate = new Date('2024-11-01');

  for (let week = 0; week < 12; week++) {
    itineraries.forEach(itinerary => {
      const tourDate = new Date(startDate);
      tourDate.setDate(tourDate.getDate() + week * 7);

      tours.push({
        id: `t-${itinerary.id}-w${week}`,
        itineraryId: itinerary.id,
        startDate: tourDate.toISOString().split('T')[0],
        endDate: new Date(tourDate.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        productLine: Math.random() > 0.3 ? 'WR' : 'WRX',
        dmcName: dmcs[Math.floor(Math.random() * dmcs.length)],
        coordinatorName: coordinators[Math.floor(Math.random() * coordinators.length)],
      });
    });
  }

  return tours;
};

const tours = generateTours();

const tagDefinitions: Record<string, string> = {
  cleanliness_hygiene: 'Cleanliness & hygiene',
  poor_accommodation_quality: 'Accommodation quality',
  itinerary_changes_cancellations: 'Itinerary changes/cancellations',
  logistics_failures: 'Logistics failures',
  comfort_issues: 'Comfort issues',
  poor_value_for_money: 'Poor value for money',
  weak_leadership_decision_making: 'Weak leadership/decision making',
  communication_clarity_issues: 'Communication clarity issues',
  friendly_kind: 'Friendly & kind',
  helpful_available: 'Helpful & available',
};

const generateSurveys = (): { responses: SurveyResponse[]; annotations: Annotation[] } => {
  const responses: SurveyResponse[] = [];
  const annotations: Annotation[] = [];

  tours.forEach(tour => {
    const numResponses = Math.floor(Math.random() * 5) + 3;

    for (let i = 0; i < numResponses; i++) {
      const overall = Math.random() > 0.3 ? Math.floor(Math.random() * 3) + 7 : Math.floor(Math.random() * 3) + 5;
      const responseId = `r-${tour.id}-${i}`;

      responses.push({
        id: responseId,
        tourId: tour.id,
        createdAt: tour.startDate,
        scores: {
          overall,
          qp: overall + (Math.random() > 0.5 ? 1 : -1),
          accommodation: overall + (Math.random() > 0.5 ? 1 : -1),
          logistics: overall + (Math.random() > 0.5 ? 1 : 0),
          preDepartureInfo: Math.floor(Math.random() * 2) + 8,
          coordinatorCourtesy: overall + (Math.random() > 0.5 ? 1 : 0),
          coordinatorLeadership: overall + (Math.random() > 0.5 ? 1 : -1),
          coordinatorOrganisation: overall + (Math.random() > 0.5 ? 1 : 0),
        },
        comments: {
          general: overall < 8 ? 'Some aspects could be improved' : 'Great experience overall',
          accommodationBad: overall < 7 ? 'Hotel was not as clean as expected' : '',
          logistics: overall < 7 ? 'Transportation delays occurred' : '',
          coordinator: overall > 8 ? 'Coordinator was amazing and very helpful' : '',
        },
        domain: 'weroad.com',
      });

      if (overall < 8) {
        const productTags = [];
        const coordinatorTags = [];

        if (Math.random() > 0.5) productTags.push('poor_accommodation_quality');
        if (Math.random() > 0.6) productTags.push('cleanliness_hygiene');
        if (Math.random() > 0.7) productTags.push('logistics_failures');
        if (Math.random() > 0.8) coordinatorTags.push('weak_leadership_decision_making');

        annotations.push({
          responseId,
          tags: { productTags, coordinatorTags },
          severity: overall < 6 ? 'HIGH' : overall < 7 ? 'MEDIUM' : 'LOW',
          confidence: 0.8 + Math.random() * 0.2,
          evidenceSnippets: [
            overall < 7 ? 'Accommodation cleanliness below standard' : 'Minor logistics delays',
          ],
        });
      }
    }
  });

  return { responses, annotations };
};

const { responses: surveyResponses, annotations } = generateSurveys();

// Generate Suggested Actions
const suggestedActions: SuggestedAction[] = [
  {
    id: 'sa-1',
    destinationId: 'd1',
    itineraryId: 'i1',
    issueTag: 'poor_accommodation_quality',
    actionType: 'ACCOMMODATION_UPGRADE',
    description: 'Review and upgrade hotel in Ubud - multiple complaints about cleanliness and amenities',
    priority: 'HIGH',
    status: 'IN_PROGRESS',
    createdAt: '2024-12-01',
    dueDate: '2025-01-15',
    owner: 'Anna P.',
    affectedTours: 8,
  },
  {
    id: 'sa-2',
    destinationId: 'd2',
    itineraryId: 'i3',
    issueTag: 'logistics_failures',
    actionType: 'SUPPLIER_REVIEW',
    description: 'Replace bus transfer provider - consistent delays and vehicle quality issues',
    priority: 'CRITICAL',
    status: 'PLANNED',
    createdAt: '2024-12-05',
    dueDate: '2024-12-20',
    owner: 'Marco R.',
    affectedTours: 12,
  },
  {
    id: 'sa-3',
    destinationId: 'd3',
    issueTag: 'weak_leadership_decision_making',
    actionType: 'COORDINATOR_TRAINING',
    description: 'Organize leadership workshop for Jordan coordinators - focus on crisis management',
    priority: 'MEDIUM',
    status: 'SUGGESTED',
    createdAt: '2024-12-10',
    dueDate: '2025-01-30',
    owner: 'Lisa K.',
    affectedTours: 6,
  },
  {
    id: 'sa-4',
    destinationId: 'd4',
    itineraryId: 'i6',
    issueTag: 'itinerary_changes_cancellations',
    actionType: 'ITINERARY_ADJUSTMENT',
    description: 'Adjust timing of Fez market visit to avoid peak hours and reduce overcrowding',
    priority: 'MEDIUM',
    status: 'COMPLETED',
    createdAt: '2024-11-15',
    dueDate: '2024-12-01',
    owner: 'Ahmed B.',
    affectedTours: 5,
  },
  {
    id: 'sa-5',
    destinationId: 'd4',
    itineraryId: 'i7',
    issueTag: 'cleanliness_hygiene',
    actionType: 'DMC_CHANGE',
    description: 'Switch DMC for Sahara camp accommodation - hygiene standards not met',
    priority: 'HIGH',
    status: 'IN_PROGRESS',
    createdAt: '2024-12-08',
    dueDate: '2025-01-10',
    owner: 'Emma T.',
    affectedTours: 9,
  },
  {
    id: 'sa-6',
    destinationId: 'd5',
    issueTag: 'poor_value_for_money',
    actionType: 'PROCESS_IMPROVEMENT',
    description: 'Renegotiate pricing with local suppliers and review included activities',
    priority: 'LOW',
    status: 'SUGGESTED',
    createdAt: '2024-12-12',
    dueDate: '2025-02-15',
    owner: 'Paolo G.',
    affectedTours: 4,
  },
];

// Generate Corrective Actions with impact tracking
const correctiveActions: CorrectiveAction[] = [
  {
    id: 'ca-1',
    suggestedActionId: 'sa-4',
    destinationId: 'd4',
    itineraryId: 'i6',
    issueTag: 'itinerary_changes_cancellations',
    actionTaken: 'Changed Fez market visit timing from 2pm to 9am, reducing crowd exposure',
    implementedAt: '2024-12-01',
    owner: 'Ahmed B.',
    notes: 'Coordinated with local guides. Early morning timing received positive feedback.',
    impactMetrics: {
      avgScoreBefore: 6.8,
      avgScoreAfter: 7.9,
      pctBelow8Before: 65,
      pctBelow8After: 28,
      toursBeforeAction: 8,
      toursAfterAction: 6,
    },
  },
  {
    id: 'ca-2',
    destinationId: 'd1',
    itineraryId: 'i2',
    issueTag: 'logistics_failures',
    actionTaken: 'Switched to new transport provider with newer vehicles and backup fleet',
    implementedAt: '2024-11-20',
    owner: 'Sarah M.',
    notes: 'New provider has 4.8/5 rating. No delays reported in subsequent tours.',
    impactMetrics: {
      avgScoreBefore: 6.5,
      avgScoreAfter: 8.1,
      pctBelow8Before: 72,
      pctBelow8After: 15,
      toursBeforeAction: 10,
      toursAfterAction: 7,
    },
  },
  {
    id: 'ca-3',
    destinationId: 'd6',
    itineraryId: 'i9',
    issueTag: 'poor_accommodation_quality',
    actionTaken: 'Upgraded Split accommodation from 3-star to 4-star boutique hotel',
    implementedAt: '2024-11-10',
    owner: 'Sofia L.',
    notes: 'Negotiated group rate. Slight cost increase offset by improved satisfaction scores.',
    impactMetrics: {
      avgScoreBefore: 7.1,
      avgScoreAfter: 8.4,
      pctBelow8Before: 58,
      pctBelow8After: 12,
      toursBeforeAction: 9,
      toursAfterAction: 8,
    },
  },
  {
    id: 'ca-4',
    destinationId: 'd3',
    itineraryId: 'i5',
    issueTag: 'communication_clarity_issues',
    actionTaken: 'Provided coordinators with detailed pre-departure info templates and communication training',
    implementedAt: '2024-11-25',
    owner: 'Lisa K.',
    notes: 'Training included role-play scenarios. Coordinators report feeling more confident.',
    impactMetrics: {
      avgScoreBefore: 7.3,
      avgScoreAfter: 8.0,
      pctBelow8Before: 48,
      pctBelow8After: 22,
      toursBeforeAction: 7,
      toursAfterAction: 5,
    },
  },
];

// Main App Component
const App: React.FC = () => {
  const [currentPage, setCurrentPage] = useState<'overview' | 'destination' | 'tour' | 'actions' | 'impact' | 'destinations'>('overview');
  const [selectedDestinationId, setSelectedDestinationId] = useState<string | null>(null);
  const [selectedTourId, setSelectedTourId] = useState<string | null>(null);
  const [selectedResponseId, setSelectedResponseId] = useState<string | null>(null);
  const [selectedActionId, setSelectedActionId] = useState<string | null>(null);
  const [selectedIssueTag, setSelectedIssueTag] = useState<string | null>(null);
  const [showCompleteActionModal, setShowCompleteActionModal] = useState(false);
  const [completedActionsState, setCompletedActionsState] = useState<CorrectiveAction[]>(correctiveActions);

  // Filters
  const [period, setPeriod] = useState<Period>('Week');
  const [grain, setGrain] = useState<Grain>('Destination');
  const [productLine, setProductLine] = useState<'All' | ProductLine>('All');
  const [filterDestination, setFilterDestination] = useState<string>('All');
  const [filterItinerary, setFilterItinerary] = useState<string>('All');
  const [filterDMC, setFilterDMC] = useState<string>('All');
  const [filterCoordinator, setFilterCoordinator] = useState<string>('All');
  const [onlyBelow8, setOnlyBelow8] = useState(true);

  const FilterBar = () => (
    <div className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex flex-wrap gap-3 items-center">
        <div className="flex gap-2">
          {(['Week', 'Month', 'Quarter'] as Period[]).map(p => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${period === p ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
            >
              {p}
            </button>
          ))}
        </div>

        <div className="w-px h-8 bg-gray-300" />

        <select
          value={grain}
          onChange={e => setGrain(e.target.value as Grain)}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
        >
          <option>Destination</option>
          <option>Itinerary</option>
        </select>

        <select
          value={productLine}
          onChange={e => setProductLine(e.target.value as any)}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
        >
          <option>All</option>
          <option>WR</option>
          <option>WRX</option>
        </select>

        <select
          value={filterDestination}
          onChange={e => setFilterDestination(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
        >
          <option value="All">All Destinations</option>
          {destinations.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
        </select>

        <select
          value={filterDMC}
          onChange={e => setFilterDMC(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
        >
          <option>All DMCs</option>
          {dmcs.map(d => <option key={d} value={d}>{d}</option>)}
        </select>

        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={onlyBelow8}
            onChange={e => setOnlyBelow8(e.target.checked)}
            className="rounded"
          />
          Only reviews &lt; 8
        </label>
      </div>
    </div>
  );

  const Sidebar = () => (
    <div className="w-64 bg-white border-r border-gray-200 h-screen flex flex-col">
      <div className="px-6 py-5 border-b border-gray-200">
        <h1 className="text-lg font-bold text-gray-900">Quality Manager</h1>
        <p className="text-xs text-gray-500 mt-1">WeRoad Dashboard</p>
      </div>

      <nav className="flex-1 px-4 py-6 space-y-1">
        <button
          onClick={() => setCurrentPage('overview')}
          className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition ${currentPage === 'overview'
              ? 'bg-blue-50 text-blue-700'
              : 'text-gray-700 hover:bg-gray-50'
            }`}
        >
          <BarChart3 className="w-5 h-5" />
          Home
        </button>

        <button
          onClick={() => setCurrentPage('destinations')}
          className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition ${currentPage === 'destinations'
              ? 'bg-blue-50 text-blue-700'
              : 'text-gray-700 hover:bg-gray-50'
            }`}
        >
          <Map className="w-5 h-5" />
          Destination Trends
        </button>

        <button
          onClick={() => setCurrentPage('actions')}
          className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition ${currentPage === 'actions'
              ? 'bg-blue-50 text-blue-700'
              : 'text-gray-700 hover:bg-gray-50'
            }`}
        >
          <Flag className="w-5 h-5" />
          Suggested Actions
        </button>

        <button
          onClick={() => setCurrentPage('impact')}
          className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition ${currentPage === 'impact'
              ? 'bg-blue-50 text-blue-700'
              : 'text-gray-700 hover:bg-gray-50'
            }`}
        >
          <Target className="w-5 h-5" />
          Impact Tracking
        </button>
      </nav>

      <div className="px-6 py-4 border-t border-gray-200">
        <div className="text-xs text-gray-500">
          Last updated: {new Date().toLocaleTimeString()}
        </div>
      </div>
    </div>
  );

  const OverviewPage = () => {
    const filteredData = useMemo(() => {
      let filtered = surveyResponses;

      if (onlyBelow8) {
        filtered = filtered.filter(r => r.scores.overall < 8);
      }

      if (filterDestination !== 'All') {
        const destItineraries = itineraries.filter(i => i.destinationId === filterDestination).map(i => i.id);
        const destTours = tours.filter(t => destItineraries.includes(t.itineraryId)).map(t => t.id);
        filtered = filtered.filter(r => destTours.includes(r.tourId));
      }

      if (productLine !== 'All') {
        const plTours = tours.filter(t => t.productLine === productLine).map(t => t.id);
        filtered = filtered.filter(r => plTours.includes(r.tourId));
      }

      return filtered;
    }, [onlyBelow8, filterDestination, productLine]);

    const avgOverall = filteredData.length > 0
      ? (filteredData.reduce((sum, r) => sum + r.scores.overall, 0) / filteredData.length).toFixed(1)
      : '0';

    const pctBelow8 = filteredData.length > 0
      ? ((filteredData.filter(r => r.scores.overall < 8).length / filteredData.length) * 100).toFixed(0)
      : '0';

    const issuesCount: Record<string, number> = {};
    filteredData.forEach(r => {
      const ann = annotations.find(a => a.responseId === r.id);
      if (ann) {
        [...ann.tags.productTags, ...ann.tags.coordinatorTags].forEach(tag => {
          issuesCount[tag] = (issuesCount[tag] || 0) + 1;
        });
      }
    });

    const topIssue = Object.entries(issuesCount).sort((a, b) => b[1] - a[1])[0];

    const destStats = destinations.map(dest => {
      const destItineraries = itineraries.filter(i => i.destinationId === dest.id).map(i => i.id);
      const destTours = tours.filter(t => destItineraries.includes(t.itineraryId)).map(t => t.id);
      const destResponses = filteredData.filter(r => destTours.includes(r.tourId));

      const avg = destResponses.length > 0
        ? destResponses.reduce((sum, r) => sum + r.scores.overall, 0) / destResponses.length
        : 0;

      const below8 = destResponses.length > 0
        ? (destResponses.filter(r => r.scores.overall < 8).length / destResponses.length) * 100
        : 0;

      const destIssues: Record<string, { count: number; severity: Record<Severity, number> }> = {};
      destResponses.forEach(r => {
        const ann = annotations.find(a => a.responseId === r.id);
        if (ann) {
          [...ann.tags.productTags, ...ann.tags.coordinatorTags].forEach(tag => {
            if (!destIssues[tag]) destIssues[tag] = { count: 0, severity: { LOW: 0, MEDIUM: 0, HIGH: 0 } };
            destIssues[tag].count++;
            destIssues[tag].severity[ann.severity]++;
          });
        }
      });

      const topDestIssue = Object.entries(destIssues).sort((a, b) => b[1].count - a[1].count)[0];

      return {
        dest,
        avg,
        below8,
        delta: (Math.random() - 0.7) * 2,
        topIssue: topDestIssue ? { tag: topDestIssue[0], count: topDestIssue[1].count, severity: topDestIssue[1].severity } : null,
      };
    }).filter(s => s.avg > 0).sort((a, b) => a.delta - b.delta);

    return (
      <div className="p-6 space-y-6">
        <h1 className="text-2xl font-bold text-gray-900">Quality Control Overview</h1>

        <div className="grid grid-cols-6 gap-4">
          <div className="bg-white rounded-lg shadow p-5 border border-gray-200">
            <div className="text-sm text-gray-600 mb-1">Avg Overall Score</div>
            <div className="text-3xl font-bold text-gray-900">{avgOverall}</div>
          </div>
          <div className="bg-white rounded-lg shadow p-5 border border-gray-200">
            <div className="text-sm text-gray-600 mb-1">% Below 8</div>
            <div className="text-3xl font-bold text-orange-600">{pctBelow8}%</div>
          </div>
          <div className="bg-white rounded-lg shadow p-5 border border-gray-200">
            <div className="text-sm text-gray-600 mb-1">Worsening Destinations</div>
            <div className="text-3xl font-bold text-red-600">{destStats.filter(s => s.delta < -0.2).length}</div>
          </div>
          <div className="bg-white rounded-lg shadow p-5 border border-gray-200">
            <div className="text-sm text-gray-600 mb-1">Top Issue</div>
            <div className="text-sm font-semibold text-gray-900">{topIssue ? tagDefinitions[topIssue[0]] : 'N/A'}</div>
          </div>
          <div className="bg-white rounded-lg shadow p-5 border border-gray-200">
            <div className="text-sm text-gray-600 mb-1">Critical Clusters</div>
            <div className="text-3xl font-bold text-red-600">
              {Object.values(issuesCount).filter(c => c > 5).length}
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-5 border border-gray-200">
            <div className="text-sm text-gray-600 mb-1">Total Reviews</div>
            <div className="text-3xl font-bold text-gray-900">{filteredData.length}</div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Worsening Destinations</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Destination</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Avg Overall</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Δ Avg</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">% Below 8</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Top Issue</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Severity</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {destStats.slice(0, 6).map(stat => (
                  <tr
                    key={stat.dest.id}
                    onClick={() => {
                      setSelectedDestinationId(stat.dest.id);
                      setCurrentPage('destination');
                    }}
                    className="hover:bg-gray-50 cursor-pointer"
                  >
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">{stat.dest.name}</td>
                    <td className="px-6 py-4 text-sm text-gray-900">{stat.avg.toFixed(1)}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1">
                        {stat.delta < 0 ? (
                          <TrendingDown className="w-4 h-4 text-red-500" />
                        ) : (
                          <TrendingUp className="w-4 h-4 text-green-500" />
                        )}
                        <span className={`text-sm font-medium ${stat.delta < 0 ? 'text-red-600' : 'text-green-600'}`}>
                          {stat.delta.toFixed(1)}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">{stat.below8.toFixed(0)}%</td>
                    <td className="px-6 py-4 text-sm">
                      {stat.topIssue ? (
                        <div>
                          <div className="font-medium text-gray-900">{tagDefinitions[stat.topIssue.tag]}</div>
                          <div className="text-xs text-gray-500">{stat.topIssue.count} occurrences</div>
                        </div>
                      ) : 'N/A'}
                    </td>
                    <td className="px-6 py-4">
                      {stat.topIssue && (
                        <div className="flex gap-1">
                          <div className="h-6 bg-yellow-400" style={{ width: `${(stat.topIssue.severity.LOW / stat.topIssue.count) * 40}px` }} />
                          <div className="h-6 bg-orange-400" style={{ width: `${(stat.topIssue.severity.MEDIUM / stat.topIssue.count) * 40}px` }} />
                          <div className="h-6 bg-red-500" style={{ width: `${(stat.topIssue.severity.HIGH / stat.topIssue.count) * 40}px` }} />
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Issue Radar - Top Clusters</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Issue</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Occurrences</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Affected Tours</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Trend</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {Object.entries(issuesCount).sort((a, b) => b[1] - a[1]).slice(0, 10).map(([tag, count]) => (
                  <tr
                    key={tag}
                    className="hover:bg-gray-50 cursor-pointer"
                    onClick={() => setSelectedIssueTag(tag)}
                  >
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">{tagDefinitions[tag]}</td>
                    <td className="px-6 py-4 text-sm text-gray-900">{count}</td>
                    <td className="px-6 py-4 text-sm text-gray-900">{Math.floor(count * 0.7)}</td>
                    <td className="px-6 py-4">
                      {Math.random() > 0.5 ? (
                        <TrendingUp className="w-4 h-4 text-green-500" />
                      ) : (
                        <TrendingDown className="w-4 h-4 text-red-500" />
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  const DestinationsPage = () => {
    const filteredData = useMemo(() => {
      let filtered = surveyResponses;

      if (onlyBelow8) {
        filtered = filtered.filter(r => r.scores.overall < 8);
      }

      if (filterDestination !== 'All') {
        const destItineraries = itineraries.filter(i => i.destinationId === filterDestination).map(i => i.id);
        const destTours = tours.filter(t => destItineraries.includes(t.itineraryId)).map(t => t.id);
        filtered = filtered.filter(r => destTours.includes(r.tourId));
      }

      if (productLine !== 'All') {
        const plTours = tours.filter(t => t.productLine === productLine).map(t => t.id);
        filtered = filtered.filter(r => plTours.includes(r.tourId));
      }

      return filtered;
    }, [onlyBelow8, filterDestination, productLine]);

    const destStats = destinations.map(dest => {
      const destItineraries = itineraries.filter(i => i.destinationId === dest.id).map(i => i.id);
      const destTours = tours.filter(t => destItineraries.includes(t.itineraryId)).map(t => t.id);
      const destResponses = filteredData.filter(r => destTours.includes(r.tourId));

      const avg = destResponses.length > 0
        ? destResponses.reduce((sum, r) => sum + r.scores.overall, 0) / destResponses.length
        : 0;

      const below8 = destResponses.length > 0
        ? (destResponses.filter(r => r.scores.overall < 8).length / destResponses.length) * 100
        : 0;

      const destIssues: Record<string, { count: number; severity: Record<Severity, number> }> = {};
      destResponses.forEach(r => {
        const ann = annotations.find(a => a.responseId === r.id);
        if (ann) {
          [...ann.tags.productTags, ...ann.tags.coordinatorTags].forEach(tag => {
            if (!destIssues[tag]) destIssues[tag] = { count: 0, severity: { LOW: 0, MEDIUM: 0, HIGH: 0 } };
            destIssues[tag].count++;
            destIssues[tag].severity[ann.severity]++;
          });
        }
      });

      const topDestIssue = Object.entries(destIssues).sort((a, b) => b[1].count - a[1].count)[0];

      return {
        dest,
        avg,
        below8,
        delta: (Math.random() - 0.7) * 2,
        topIssue: topDestIssue ? { tag: topDestIssue[0], count: topDestIssue[1].count, severity: topDestIssue[1].severity } : null,
        totalReviews: destResponses.length,
      };
    }).filter(s => s.avg > 0).sort((a, b) => a.delta - b.delta);

    return (
      <div className="p-6 space-y-6">
        <h1 className="text-2xl font-bold text-gray-900">Destination Trends</h1>

        <div className="grid grid-cols-4 gap-4">
          <div className="bg-white rounded-lg shadow p-5 border border-gray-200">
            <div className="text-sm text-gray-600 mb-1">Total Destinations</div>
            <div className="text-3xl font-bold text-gray-900">{destStats.length}</div>
          </div>
          <div className="bg-white rounded-lg shadow p-5 border border-red-200 bg-red-50">
            <div className="text-sm text-red-600 mb-1">Worsening</div>
            <div className="text-3xl font-bold text-red-900">{destStats.filter(s => s.delta < -0.2).length}</div>
          </div>
          <div className="bg-white rounded-lg shadow p-5 border border-green-200 bg-green-50">
            <div className="text-sm text-green-600 mb-1">Improving</div>
            <div className="text-3xl font-bold text-green-900">{destStats.filter(s => s.delta > 0.2).length}</div>
          </div>
          <div className="bg-white rounded-lg shadow p-5 border border-gray-200">
            <div className="text-sm text-gray-600 mb-1">Avg Overall Score</div>
            <div className="text-3xl font-bold text-gray-900">
              {(destStats.reduce((sum, s) => sum + s.avg, 0) / destStats.length).toFixed(1)}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">All Destinations</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Destination</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Country</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Avg Overall</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Δ Avg</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">% Below 8</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Reviews</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Top Issue</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Severity</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {destStats.map(stat => (
                  <tr
                    key={stat.dest.id}
                    onClick={() => {
                      setSelectedDestinationId(stat.dest.id);
                      setCurrentPage('destination');
                    }}
                    className="hover:bg-gray-50 cursor-pointer"
                  >
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">{stat.dest.name}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{stat.dest.country}</td>
                    <td className="px-6 py-4 text-sm text-gray-900">{stat.avg.toFixed(1)}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1">
                        {stat.delta < 0 ? (
                          <TrendingDown className="w-4 h-4 text-red-500" />
                        ) : (
                          <TrendingUp className="w-4 h-4 text-green-500" />
                        )}
                        <span className={`text-sm font-medium ${stat.delta < 0 ? 'text-red-600' : 'text-green-600'}`}>
                          {stat.delta.toFixed(1)}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">{stat.below8.toFixed(0)}%</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{stat.totalReviews}</td>
                    <td className="px-6 py-4 text-sm">
                      {stat.topIssue ? (
                        <div>
                          <div className="font-medium text-gray-900">{tagDefinitions[stat.topIssue.tag]}</div>
                          <div className="text-xs text-gray-500">{stat.topIssue.count} occurrences</div>
                        </div>
                      ) : 'N/A'}
                    </td>
                    <td className="px-6 py-4">
                      {stat.topIssue && (
                        <div className="flex gap-1">
                          <div className="h-6 bg-yellow-400" style={{ width: `${(stat.topIssue.severity.LOW / stat.topIssue.count) * 40}px` }} />
                          <div className="h-6 bg-orange-400" style={{ width: `${(stat.topIssue.severity.MEDIUM / stat.topIssue.count) * 40}px` }} />
                          <div className="h-6 bg-red-500" style={{ width: `${(stat.topIssue.severity.HIGH / stat.topIssue.count) * 40}px` }} />
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  const ActionsPage = () => {
    const filteredActions = suggestedActions.filter(action =>
      filterDestination === 'All' || action.destinationId === filterDestination
    ).sort((a, b) => {
      const priorityOrder = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });

    const statusCounts = {
      SUGGESTED: filteredActions.filter(a => a.status === 'SUGGESTED').length,
      PLANNED: filteredActions.filter(a => a.status === 'PLANNED').length,
      IN_PROGRESS: filteredActions.filter(a => a.status === 'IN_PROGRESS').length,
      COMPLETED: filteredActions.filter(a => a.status === 'COMPLETED').length,
    };

    return (
      <div className="p-6 space-y-6">
        <h1 className="text-2xl font-bold text-gray-900">Suggested Actions</h1>

        <div className="grid grid-cols-4 gap-4">
          <div className="bg-white rounded-lg shadow p-5 border border-gray-200">
            <div className="text-sm text-gray-600 mb-1">Suggested</div>
            <div className="text-3xl font-bold text-gray-900">{statusCounts.SUGGESTED}</div>
          </div>
          <div className="bg-white rounded-lg shadow p-5 border border-purple-200 bg-purple-50">
            <div className="text-sm text-purple-600 mb-1">Planned</div>
            <div className="text-3xl font-bold text-purple-900">{statusCounts.PLANNED}</div>
          </div>
          <div className="bg-white rounded-lg shadow p-5 border border-blue-200 bg-blue-50">
            <div className="text-sm text-blue-600 mb-1">In Progress</div>
            <div className="text-3xl font-bold text-blue-900">{statusCounts.IN_PROGRESS}</div>
          </div>
          <div className="bg-white rounded-lg shadow p-5 border border-green-200 bg-green-50">
            <div className="text-sm text-green-600 mb-1">Completed</div>
            <div className="text-3xl font-bold text-green-900">{statusCounts.COMPLETED}</div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">All Actions</h2>
          </div>
          <div className="divide-y divide-gray-200">
            {filteredActions.map(action => {
              const dest = destinations.find(d => d.id === action.destinationId);
              const itinerary = action.itineraryId ? itineraries.find(i => i.id === action.itineraryId) : null;

              return (
                <div
                  key={action.id}
                  className="px-6 py-4 hover:bg-gray-50 cursor-pointer transition"
                  onClick={() => setSelectedActionId(action.id)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className={`px-2 py-1 text-xs font-medium rounded ${action.priority === 'CRITICAL' ? 'bg-red-100 text-red-800' :
                            action.priority === 'HIGH' ? 'bg-orange-100 text-orange-800' :
                              action.priority === 'MEDIUM' ? 'bg-yellow-100 text-yellow-800' :
                                'bg-gray-100 text-gray-600'
                          }`}>
                          {action.priority}
                        </span>
                        <span className={`px-2 py-1 text-xs rounded ${action.status === 'COMPLETED' ? 'bg-green-100 text-green-800' :
                            action.status === 'IN_PROGRESS' ? 'bg-blue-100 text-blue-800' :
                              action.status === 'PLANNED' ? 'bg-purple-100 text-purple-800' :
                                'bg-gray-100 text-gray-600'
                          }`}>
                          {action.status.replace('_', ' ')}
                        </span>
                        <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                          {tagDefinitions[action.issueTag]}
                        </span>
                        <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded">
                          {action.actionType.replace(/_/g, ' ')}
                        </span>
                      </div>
                      <p className="text-sm font-medium text-gray-900 mb-2">{action.description}</p>
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <span className="font-medium">{dest?.name}</span>
                        {itinerary && (
                          <>
                            <span>•</span>
                            <span>{itinerary.name}</span>
                          </>
                        )}
                        <span>•</span>
                        <span>Due: {action.dueDate}</span>
                        <span>•</span>
                        <span>Owner: {action.owner}</span>
                        <span>•</span>
                        <span>{action.affectedTours} tours affected</span>
                      </div>
                    </div>
                    <button className="ml-4 text-blue-600 hover:text-blue-700 text-sm font-medium">
                      View Details →
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  const ImpactTrackingPage = () => {
    const filteredActions = completedActionsState.filter(action =>
      filterDestination === 'All' || action.destinationId === filterDestination
    ).sort((a, b) => new Date(b.implementedAt).getTime() - new Date(a.implementedAt).getTime());

    const totalAvgImprovement = filteredActions.length > 0 ? filteredActions.reduce((sum, a) =>
      sum + (a.impactMetrics.avgScoreAfter - a.impactMetrics.avgScoreBefore), 0
    ) / filteredActions.length : 0;

    const totalPctImprovement = filteredActions.length > 0 ? filteredActions.reduce((sum, a) =>
      sum + (a.impactMetrics.pctBelow8Before - a.impactMetrics.pctBelow8After), 0
    ) / filteredActions.length : 0;

    return (
      <div className="p-6 space-y-6">
        <h1 className="text-2xl font-bold text-gray-900">Impact Tracking</h1>

        <div className="grid grid-cols-3 gap-4">
          <div className="bg-white rounded-lg shadow p-5 border border-gray-200">
            <div className="text-sm text-gray-600 mb-1">Completed Actions</div>
            <div className="text-3xl font-bold text-gray-900">{filteredActions.length}</div>
          </div>
          <div className="bg-white rounded-lg shadow p-5 border border-green-200 bg-green-50">
            <div className="text-sm text-green-600 mb-1">Avg Score Improvement</div>
            <div className="text-3xl font-bold text-green-900">+{totalAvgImprovement.toFixed(1)}</div>
          </div>
          <div className="bg-white rounded-lg shadow p-5 border border-green-200 bg-green-50">
            <div className="text-sm text-green-600 mb-1">% Below 8 Reduction</div>
            <div className="text-3xl font-bold text-green-900">-{totalPctImprovement.toFixed(0)}%</div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Corrective Actions & Results</h2>
          </div>
          <div className="divide-y divide-gray-200">
            {filteredActions.map(action => {
              const dest = destinations.find(d => d.id === action.destinationId);
              const itinerary = action.itineraryId ? itineraries.find(i => i.id === action.itineraryId) : null;
              const scoreDelta = action.impactMetrics.avgScoreAfter - action.impactMetrics.avgScoreBefore;
              const pctDelta = action.impactMetrics.pctBelow8Before - action.impactMetrics.pctBelow8After;

              return (
                <div
                  key={action.id}
                  className="px-6 py-5 hover:bg-gray-50 cursor-pointer transition"
                  onClick={() => {
                    const relatedSuggested = suggestedActions.find(sa => sa.id === action.suggestedActionId);
                    if (relatedSuggested) {
                      setSelectedActionId(relatedSuggested.id);
                    } else {
                      // If there's no related suggested action, show the corrective action details
                      setSelectedActionId(action.id);
                    }
                  }}
                >
                  <div className="mb-3">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded font-medium">
                        COMPLETED
                      </span>
                      <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                        {tagDefinitions[action.issueTag]}
                      </span>
                    </div>
                    <p className="text-sm font-medium text-gray-900 mb-1">{action.actionTaken}</p>
                    <div className="text-xs text-gray-500">
                      {dest?.name}{itinerary ? ` - ${itinerary.name}` : ''} • Implemented: {action.implementedAt} • Owner: {action.owner}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg p-4 border border-green-200">
                      <div className="text-xs font-medium text-green-700 mb-2">Average Score</div>
                      <div className="flex items-center justify-between">
                        <div className="text-center">
                          <div className="text-xl font-bold text-gray-900">
                            {action.impactMetrics.avgScoreBefore.toFixed(1)}
                          </div>
                          <div className="text-xs text-gray-500">Before</div>
                        </div>
                        <div className="text-gray-400">→</div>
                        <div className="text-center">
                          <div className="text-xl font-bold text-green-700">
                            {action.impactMetrics.avgScoreAfter.toFixed(1)}
                          </div>
                          <div className="text-xs text-gray-500">After</div>
                        </div>
                        <div className="text-center px-3 py-1 bg-green-100 rounded-full">
                          <div className="text-lg font-bold text-green-700">
                            +{scoreDelta.toFixed(1)}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-lg p-4 border border-blue-200">
                      <div className="text-xs font-medium text-blue-700 mb-2">% Below 8</div>
                      <div className="flex items-center justify-between">
                        <div className="text-center">
                          <div className="text-xl font-bold text-gray-900">
                            {action.impactMetrics.pctBelow8Before}%
                          </div>
                          <div className="text-xs text-gray-500">Before</div>
                        </div>
                        <div className="text-gray-400">→</div>
                        <div className="text-center">
                          <div className="text-xl font-bold text-blue-700">
                            {action.impactMetrics.pctBelow8After}%
                          </div>
                          <div className="text-xs text-gray-500">After</div>
                        </div>
                        <div className="text-center px-3 py-1 bg-blue-100 rounded-full">
                          <div className="text-lg font-bold text-blue-700">
                            -{pctDelta}%
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-3 bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <p className="text-sm text-blue-900">{action.notes}</p>
                    <div className="text-xs text-blue-700 mt-1">
                      Based on {action.impactMetrics.toursBeforeAction} tours before • {action.impactMetrics.toursAfterAction} tours after
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  const DestinationPage = () => {
    if (!selectedDestinationId) return null;

    const destination = destinations.find(d => d.id === selectedDestinationId);
    const destItineraries = itineraries.filter(i => i.destinationId === selectedDestinationId);
    const destTours = tours.filter(t => destItineraries.map(i => i.id).includes(t.itineraryId));
    const destResponses = surveyResponses.filter(r => destTours.map(t => t.id).includes(r.tourId));

    const weeklyData = Array.from({ length: 12 }, (_, i) => {
      const weekStart = new Date('2024-11-01');
      weekStart.setDate(weekStart.getDate() + i * 7);

      const weekTours = destTours.filter(t => {
        const tourDate = new Date(t.startDate);
        return tourDate >= weekStart && tourDate < new Date(weekStart.getTime() + 7 * 24 * 60 * 60 * 1000);
      });

      const weekResponses = destResponses.filter(r => weekTours.map(t => t.id).includes(r.tourId));
      const avg = weekResponses.length > 0
        ? weekResponses.reduce((sum, r) => sum + r.scores.overall, 0) / weekResponses.length
        : 0;

      const below8 = weekResponses.length > 0
        ? (weekResponses.filter(r => r.scores.overall < 8).length / weekResponses.length) * 100
        : 0;

      return {
        week: `W${i + 1}`,
        avgOverall: Number(avg.toFixed(1)),
        pctBelow8: Number(below8.toFixed(0)),
      };
    });

    const issuesCount: Record<string, { count: number; severity: Record<Severity, number> }> = {};
    destResponses.forEach(r => {
      const ann = annotations.find(a => a.responseId === r.id);
      if (ann) {
        [...ann.tags.productTags, ...ann.tags.coordinatorTags].forEach(tag => {
          if (!issuesCount[tag]) issuesCount[tag] = { count: 0, severity: { LOW: 0, MEDIUM: 0, HIGH: 0 } };
          issuesCount[tag].count++;
          issuesCount[tag].severity[ann.severity]++;
        });
      }
    });

    const evidenceItems = destResponses.slice(0, 10).map(r => {
      const ann = annotations.find(a => a.responseId === r.id);
      const tour = tours.find(t => t.id === r.tourId);
      return { response: r, annotation: ann, tour };
    }).filter(item => item.annotation);

    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center gap-4">
          <button
            onClick={() => setCurrentPage('overview')}
            className="text-blue-600 hover:text-blue-700 text-sm font-medium"
          >
            ← Back to Overview
          </button>
          <h1 className="text-2xl font-bold text-gray-900">{destination?.name}</h1>
        </div>

        <div className="grid grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
            <h3 className="text-sm font-medium text-gray-700 mb-4">Avg Overall Score Trend</h3>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={weeklyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="week" />
                <YAxis domain={[5, 10]} />
                <Tooltip />
                <Line type="monotone" dataKey="avgOverall" stroke="#3b82f6" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
            <h3 className="text-sm font-medium text-gray-700 mb-4">% Reviews Below 8</h3>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={weeklyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="week" />
                <YAxis domain={[0, 100]} />
                <Tooltip />
                <Line type="monotone" dataKey="pctBelow8" stroke="#f59e0b" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Top Issues</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Issue</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Occurrences</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Severity Distribution</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {Object.entries(issuesCount).sort((a, b) => b[1].count - a[1].count).map(([tag, data]) => (
                  <tr key={tag}>
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">{tagDefinitions[tag]}</td>
                    <td className="px-6 py-4 text-sm text-gray-900">{data.count}</td>
                    <td className="px-6 py-4">
                      <div className="flex gap-1">
                        <div className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded">
                          L: {data.severity.LOW}
                        </div>
                        <div className="px-2 py-1 bg-orange-100 text-orange-800 text-xs rounded">
                          M: {data.severity.MEDIUM}
                        </div>
                        <div className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded">
                          H: {data.severity.HIGH}
                        </div>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Evidence</h2>
          </div>
          <div className="divide-y divide-gray-200">
            {evidenceItems.map((item, idx) => (
              <div key={idx} className="px-6 py-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      {item.annotation!.tags.productTags.concat(item.annotation!.tags.coordinatorTags).map(tag => (
                        <span key={tag} className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                          {tagDefinitions[tag]}
                        </span>
                      ))}
                      <span className={`px-2 py-1 text-xs rounded ${item.annotation!.severity === 'HIGH' ? 'bg-red-100 text-red-800' :
                          item.annotation!.severity === 'MEDIUM' ? 'bg-orange-100 text-orange-800' :
                            'bg-yellow-100 text-yellow-800'
                        }`}>
                        {item.annotation!.severity}
                      </span>
                    </div>
                    <p className="text-sm text-gray-700 mb-2">{item.annotation!.evidenceSnippets[0]}</p>
                    <p className="text-xs text-gray-500">Tour: {item.tour?.id}</p>
                  </div>
                  <button
                    onClick={() => {
                      setSelectedTourId(item.tour!.id);
                      setCurrentPage('tour');
                    }}
                    className="ml-4 px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700"
                  >
                    Open Tour
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const TourPage = () => {
    if (!selectedTourId) return null;

    const tour = tours.find(t => t.id === selectedTourId);
    const itinerary = itineraries.find(i => i.id === tour?.itineraryId);
    const destination = destinations.find(d => d.id === itinerary?.destinationId);
    const tourResponses = surveyResponses.filter(r => r.tourId === selectedTourId);

    const avgScores = {
      overall: tourResponses.reduce((sum, r) => sum + r.scores.overall, 0) / tourResponses.length,
      qp: tourResponses.reduce((sum, r) => sum + r.scores.qp, 0) / tourResponses.length,
      accommodation: tourResponses.reduce((sum, r) => sum + r.scores.accommodation, 0) / tourResponses.length,
      logistics: tourResponses.reduce((sum, r) => sum + r.scores.logistics, 0) / tourResponses.length,
      coordinatorCourtesy: tourResponses.reduce((sum, r) => sum + r.scores.coordinatorCourtesy, 0) / tourResponses.length,
    };

    const commentsByTag: Record<string, Array<{ comment: string; severity: Severity; snippet: string }>> = {};
    tourResponses.forEach(r => {
      const ann = annotations.find(a => a.responseId === r.id);
      if (ann) {
        [...ann.tags.productTags, ...ann.tags.coordinatorTags].forEach(tag => {
          if (!commentsByTag[tag]) commentsByTag[tag] = [];
          commentsByTag[tag].push({
            comment: r.comments.general || r.comments.accommodationBad || r.comments.logistics,
            severity: ann.severity,
            snippet: ann.evidenceSnippets[0],
          });
        });
      }
    });

    const copyToClipboard = () => {
      const text = `
Tour Summary Report
Tour ID: ${tour?.id}
Dates: ${tour?.startDate} to ${tour?.endDate}
Itinerary: ${itinerary?.name}
Destination: ${destination?.name}
DMC: ${tour?.dmcName}
Coordinator: ${tour?.coordinatorName}

Survey Results (${tourResponses.length} responses):
- Overall: ${avgScores.overall.toFixed(1)}
- Quality/Price: ${avgScores.qp.toFixed(1)}
- Accommodation: ${avgScores.accommodation.toFixed(1)}
- Logistics: ${avgScores.logistics.toFixed(1)}
- Coordinator Courtesy: ${avgScores.coordinatorCourtesy.toFixed(1)}

Key Issues:
${Object.entries(commentsByTag).map(([tag, comments]) =>
        `- ${tagDefinitions[tag]}: ${comments.length} mentions`
      ).join('\n')}
      `.trim();

      navigator.clipboard.writeText(text);
      alert('Summary copied to clipboard!');
    };

    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center gap-4">
          <button
            onClick={() => setCurrentPage('destination')}
            className="text-blue-600 hover:text-blue-700 text-sm font-medium"
          >
            ← Back to Destination
          </button>
          <h1 className="text-2xl font-bold text-gray-900">Tour {tour?.id}</h1>
        </div>

        <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
          <div className="grid grid-cols-2 gap-6">
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-1">Dates</h3>
              <p className="text-gray-900">{tour?.startDate} to {tour?.endDate}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-1">Itinerary</h3>
              <p className="text-gray-900">{itinerary?.name}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-1">Destination</h3>
              <p className="text-gray-900">{destination?.name}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-1">DMC</h3>
              <p className="text-gray-900">{tour?.dmcName}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-1">Coordinator</h3>
              <p className="text-gray-900">{tour?.coordinatorName}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-1">Product Line</h3>
              <p className="text-gray-900">{tour?.productLine}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Survey Summary ({tourResponses.length} responses)</h2>
          <div className="grid grid-cols-5 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">{avgScores.overall.toFixed(1)}</div>
              <div className="text-sm text-gray-600">Overall</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">{avgScores.qp.toFixed(1)}</div>
              <div className="text-sm text-gray-600">Quality/Price</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">{avgScores.accommodation.toFixed(1)}</div>
              <div className="text-sm text-gray-600">Accommodation</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">{avgScores.logistics.toFixed(1)}</div>
              <div className="text-sm text-gray-600">Logistics</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">{avgScores.coordinatorCourtesy.toFixed(1)}</div>
              <div className="text-sm text-gray-600">Coordinator</div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Comments by Issue Tag</h2>
          </div>
          <div className="divide-y divide-gray-200">
            {Object.entries(commentsByTag).map(([tag, comments]) => (
              <div key={tag} className="px-6 py-4">
                <h3 className="font-medium text-gray-900 mb-3">{tagDefinitions[tag]}</h3>
                <div className="space-y-2">
                  {comments.map((c, idx) => (
                    <div key={idx} className="pl-4 border-l-2 border-gray-200">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`px-2 py-0.5 text-xs rounded ${c.severity === 'HIGH' ? 'bg-red-100 text-red-800' :
                            c.severity === 'MEDIUM' ? 'bg-orange-100 text-orange-800' :
                              'bg-yellow-100 text-yellow-800'
                          }`}>
                          {c.severity}
                        </span>
                      </div>
                      <p className="text-sm text-gray-700">{c.snippet}</p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={copyToClipboard}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
          >
            Copy Summary for DMC
          </button>
          <button
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium"
          >
            Mark as Reviewed
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar />

      <div className="flex-1 flex flex-col">
        <FilterBar />

        <div className="flex-1 overflow-auto">
          {currentPage === 'overview' && <OverviewPage />}
          {currentPage === 'destinations' && <DestinationsPage />}
          {currentPage === 'actions' && <ActionsPage />}
          {currentPage === 'impact' && <ImpactTrackingPage />}
          {currentPage === 'destination' && <DestinationPage />}
          {currentPage === 'tour' && <TourPage />}
        </div>
      </div>

      {selectedIssueTag && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Issue Details: {tagDefinitions[selectedIssueTag]}</h2>
              <button
                onClick={() => setSelectedIssueTag(null)}
                className="text-gray-500 hover:text-gray-700 text-2xl leading-none"
              >
                ✕
              </button>
            </div>

            {(() => {
              const filteredData = surveyResponses.filter(r => {
                if (onlyBelow8 && r.scores.overall >= 8) return false;
                if (filterDestination !== 'All') {
                  const destItineraries = itineraries.filter(i => i.destinationId === filterDestination).map(i => i.id);
                  const destTours = tours.filter(t => destItineraries.includes(t.itineraryId)).map(t => t.id);
                  if (!destTours.includes(r.tourId)) return false;
                }
                return true;
              });

              const issueResponses = filteredData.filter(r => {
                const ann = annotations.find(a => a.responseId === r.id);
                return ann && [...ann.tags.productTags, ...ann.tags.coordinatorTags].includes(selectedIssueTag);
              });

              const severityCount = { LOW: 0, MEDIUM: 0, HIGH: 0 };
              issueResponses.forEach(r => {
                const ann = annotations.find(a => a.responseId === r.id);
                if (ann) severityCount[ann.severity]++;
              });

              const affectedDestinations = new Set(
                issueResponses.map(r => {
                  const tour = tours.find(t => t.id === r.tourId);
                  const itinerary = itineraries.find(i => i.id === tour?.itineraryId);
                  return itinerary?.destinationId;
                })
              );

              return (
                <div className="space-y-6">
                  <div className="grid grid-cols-4 gap-4">
                    <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                      <div className="text-sm text-gray-600 mb-1">Total Occurrences</div>
                      <div className="text-2xl font-bold text-gray-900">{issueResponses.length}</div>
                    </div>
                    <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200">
                      <div className="text-sm text-yellow-700 mb-1">Low Severity</div>
                      <div className="text-2xl font-bold text-yellow-900">{severityCount.LOW}</div>
                    </div>
                    <div className="bg-orange-50 rounded-lg p-4 border border-orange-200">
                      <div className="text-sm text-orange-700 mb-1">Medium Severity</div>
                      <div className="text-2xl font-bold text-orange-900">{severityCount.MEDIUM}</div>
                    </div>
                    <div className="bg-red-50 rounded-lg p-4 border border-red-200">
                      <div className="text-sm text-red-700 mb-1">High Severity</div>
                      <div className="text-2xl font-bold text-red-900">{severityCount.HIGH}</div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-sm font-medium text-gray-700 mb-2">Affected Destinations</h3>
                    <div className="flex flex-wrap gap-2">
                      {Array.from(affectedDestinations).map(destId => {
                        const dest = destinations.find(d => d.id === destId);
                        return dest ? (
                          <span key={destId} className="px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full">
                            {dest.name}
                          </span>
                        ) : null;
                      })}
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">Evidence Samples</h3>
                    <div className="space-y-3">
                      {issueResponses.slice(0, 10).map(r => {
                        const ann = annotations.find(a => a.responseId === r.id);
                        const tour = tours.find(t => t.id === r.tourId);
                        const itinerary = itineraries.find(i => i.id === tour?.itineraryId);
                        const destination = destinations.find(d => d.id === itinerary?.destinationId);

                        return (
                          <div key={r.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50">
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <span className={`px-2 py-1 text-xs rounded ${ann?.severity === 'HIGH' ? 'bg-red-100 text-red-800' :
                                      ann?.severity === 'MEDIUM' ? 'bg-orange-100 text-orange-800' :
                                        'bg-yellow-100 text-yellow-800'
                                    }`}>
                                    {ann?.severity}
                                  </span>
                                  <span className="text-xs text-gray-500">
                                    {destination?.name} - {tour?.id}
                                  </span>
                                </div>
                                <p className="text-sm text-gray-700 mb-1">
                                  {ann?.evidenceSnippets[0]}
                                </p>
                                <p className="text-xs text-gray-500">
                                  Overall score: {r.scores.overall}/10
                                </p>
                              </div>
                              <button
                                onClick={() => {
                                  setSelectedTourId(tour!.id);
                                  setSelectedIssueTag(null);
                                  setCurrentPage('tour');
                                }}
                                className="ml-4 px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700"
                              >
                                View Tour
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {selectedActionId && !showCompleteActionModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-3xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Action Details</h2>
              <button
                onClick={() => {
                  setSelectedActionId(null);
                  setShowCompleteActionModal(false);
                }}
                className="text-gray-500 hover:text-gray-700 text-2xl leading-none"
              >
                ✕
              </button>
            </div>
            {(() => {
              const action = suggestedActions.find(a => a.id === selectedActionId);
              if (!action) {
                // It's a corrective action without suggested action
                const correctiveAction = completedActionsState.find(ca => ca.id === selectedActionId);
                if (!correctiveAction) return null;

                const dest = destinations.find(d => d.id === correctiveAction.destinationId);
                const itinerary = correctiveAction.itineraryId ? itineraries.find(i => i.id === correctiveAction.itineraryId) : null;

                return (
                  <div className="space-y-6">
                    <div className="flex items-center gap-2">
                      <span className="px-3 py-1 bg-green-100 text-green-800 text-sm rounded font-medium">
                        COMPLETED
                      </span>
                    </div>

                    <div>
                      <h3 className="text-sm font-medium text-gray-500 mb-1">Issue Addressed</h3>
                      <div className="px-3 py-2 bg-gray-100 text-gray-900 rounded inline-block">
                        {tagDefinitions[correctiveAction.issueTag]}
                      </div>
                    </div>

                    <div>
                      <h3 className="text-sm font-medium text-gray-500 mb-1">Action Taken</h3>
                      <p className="text-gray-900">{correctiveAction.actionTaken}</p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <h3 className="text-sm font-medium text-gray-500 mb-1">Destination</h3>
                        <p className="text-gray-900">{dest?.name}</p>
                      </div>
                      {itinerary && (
                        <div>
                          <h3 className="text-sm font-medium text-gray-500 mb-1">Itinerary</h3>
                          <p className="text-gray-900">{itinerary.name}</p>
                        </div>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <h3 className="text-sm font-medium text-gray-500 mb-1">Owner</h3>
                        <p className="text-gray-900">{correctiveAction.owner}</p>
                      </div>
                      <div>
                        <h3 className="text-sm font-medium text-gray-500 mb-1">Implemented</h3>
                        <p className="text-gray-900">{correctiveAction.implementedAt}</p>
                      </div>
                    </div>

                    <div className="border-t border-gray-200 pt-4">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Impact Results</h3>

                      <div className="grid grid-cols-2 gap-4 mb-4">
                        <div className="bg-gray-50 rounded-lg p-4">
                          <h4 className="text-sm font-medium text-gray-700 mb-3">Average Score</h4>
                          <div className="flex items-center justify-between">
                            <div className="text-center">
                              <div className="text-2xl font-bold text-gray-900">
                                {correctiveAction.impactMetrics.avgScoreBefore.toFixed(1)}
                              </div>
                              <div className="text-xs text-gray-500">Before</div>
                            </div>
                            <div className="text-gray-400">→</div>
                            <div className="text-center">
                              <div className="text-2xl font-bold text-green-600">
                                {correctiveAction.impactMetrics.avgScoreAfter.toFixed(1)}
                              </div>
                              <div className="text-xs text-gray-500">After</div>
                            </div>
                            <div className="text-center">
                              <div className="text-xl font-bold text-green-600">
                                +{(correctiveAction.impactMetrics.avgScoreAfter - correctiveAction.impactMetrics.avgScoreBefore).toFixed(1)}
                              </div>
                              <div className="text-xs text-gray-500">Δ</div>
                            </div>
                          </div>
                        </div>

                        <div className="bg-gray-50 rounded-lg p-4">
                          <h4 className="text-sm font-medium text-gray-700 mb-3">% Below 8</h4>
                          <div className="flex items-center justify-between">
                            <div className="text-center">
                              <div className="text-2xl font-bold text-gray-900">
                                {correctiveAction.impactMetrics.pctBelow8Before}%
                              </div>
                              <div className="text-xs text-gray-500">Before</div>
                            </div>
                            <div className="text-gray-400">→</div>
                            <div className="text-center">
                              <div className="text-2xl font-bold text-green-600">
                                {correctiveAction.impactMetrics.pctBelow8After}%
                              </div>
                              <div className="text-xs text-gray-500">After</div>
                            </div>
                            <div className="text-center">
                              <div className="text-xl font-bold text-green-600">
                                -{correctiveAction.impactMetrics.pctBelow8Before - correctiveAction.impactMetrics.pctBelow8After}%
                              </div>
                              <div className="text-xs text-gray-500">Δ</div>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <h4 className="text-sm font-medium text-blue-900 mb-2">Notes</h4>
                        <p className="text-sm text-blue-800">{correctiveAction.notes}</p>
                        <div className="text-xs text-blue-700 mt-2">
                          Based on {correctiveAction.impactMetrics.toursBeforeAction} tours before and {correctiveAction.impactMetrics.toursAfterAction} tours after implementation
                        </div>
                      </div>
                    </div>
                  </div>
                );
              }

              const dest = destinations.find(d => d.id === action.destinationId);
              const itinerary = action.itineraryId ? itineraries.find(i => i.id === action.itineraryId) : null;
              const relatedCorrectiveAction = completedActionsState.find(ca => ca.suggestedActionId === action.id);

              return (
                <div className="space-y-6">
                  <div className="flex items-center gap-2">
                    <span className={`px-3 py-1 text-sm font-medium rounded ${action.priority === 'CRITICAL' ? 'bg-red-100 text-red-800' :
                        action.priority === 'HIGH' ? 'bg-orange-100 text-orange-800' :
                          action.priority === 'MEDIUM' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-gray-100 text-gray-600'
                      }`}>
                      {action.priority}
                    </span>
                    <span className={`px-3 py-1 text-sm rounded ${action.status === 'COMPLETED' ? 'bg-green-100 text-green-800' :
                        action.status === 'IN_PROGRESS' ? 'bg-blue-100 text-blue-800' :
                          action.status === 'PLANNED' ? 'bg-purple-100 text-purple-800' :
                            'bg-gray-100 text-gray-600'
                      }`}>
                      {action.status.replace('_', ' ')}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-sm font-medium text-gray-500 mb-1">Issue Addressed</h3>
                    <div className="px-3 py-2 bg-gray-100 text-gray-900 rounded inline-block">
                      {tagDefinitions[action.issueTag]}
                    </div>
                  </div>

                  <div>
                    <h3 className="text-sm font-medium text-gray-500 mb-1">Action Type</h3>
                    <p className="text-gray-900">{action.actionType.replace(/_/g, ' ')}</p>
                  </div>

                  <div>
                    <h3 className="text-sm font-medium text-gray-500 mb-1">Description</h3>
                    <p className="text-gray-900">{action.description}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h3 className="text-sm font-medium text-gray-500 mb-1">Destination</h3>
                      <p className="text-gray-900">{dest?.name}</p>
                    </div>
                    {itinerary && (
                      <div>
                        <h3 className="text-sm font-medium text-gray-500 mb-1">Itinerary</h3>
                        <p className="text-gray-900">{itinerary.name}</p>
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <h3 className="text-sm font-medium text-gray-500 mb-1">Owner</h3>
                      <p className="text-gray-900">{action.owner}</p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-gray-500 mb-1">Created</h3>
                      <p className="text-gray-900">{action.createdAt}</p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-gray-500 mb-1">Due Date</h3>
                      <p className="text-gray-900">{action.dueDate}</p>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-sm font-medium text-gray-500 mb-1">Impact Scope</h3>
                    <p className="text-gray-900">{action.affectedTours} tours affected</p>
                  </div>

                  {relatedCorrectiveAction && (
                    <div className="border-t border-gray-200 pt-4">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Implementation & Impact</h3>

                      <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                        <div className="flex items-center gap-2 mb-2">
                          <CheckCircle className="w-5 h-5 text-green-600" />
                          <span className="font-medium text-green-900">Action Completed</span>
                        </div>
                        <p className="text-sm text-green-800">{relatedCorrectiveAction.actionTaken}</p>
                        <p className="text-xs text-green-700 mt-2">Implemented: {relatedCorrectiveAction.implementedAt}</p>
                      </div>

                      <div className="grid grid-cols-2 gap-4 mb-4">
                        <div className="bg-gray-50 rounded-lg p-4">
                          <h4 className="text-sm font-medium text-gray-700 mb-3">Average Score</h4>
                          <div className="flex items-center justify-between">
                            <div className="text-center">
                              <div className="text-2xl font-bold text-gray-900">
                                {relatedCorrectiveAction.impactMetrics.avgScoreBefore.toFixed(1)}
                              </div>
                              <div className="text-xs text-gray-500">Before</div>
                            </div>
                            <div className="text-gray-400">→</div>
                            <div className="text-center">
                              <div className="text-2xl font-bold text-green-600">
                                {relatedCorrectiveAction.impactMetrics.avgScoreAfter.toFixed(1)}
                              </div>
                              <div className="text-xs text-gray-500">After</div>
                            </div>
                            <div className="text-center">
                              <div className="text-xl font-bold text-green-600">
                                +{(relatedCorrectiveAction.impactMetrics.avgScoreAfter - relatedCorrectiveAction.impactMetrics.avgScoreBefore).toFixed(1)}
                              </div>
                              <div className="text-xs text-gray-500">Δ</div>
                            </div>
                          </div>
                        </div>

                        <div className="bg-gray-50 rounded-lg p-4">
                          <h4 className="text-sm font-medium text-gray-700 mb-3">% Below 8</h4>
                          <div className="flex items-center justify-between">
                            <div className="text-center">
                              <div className="text-2xl font-bold text-gray-900">
                                {relatedCorrectiveAction.impactMetrics.pctBelow8Before}%
                              </div>
                              <div className="text-xs text-gray-500">Before</div>
                            </div>
                            <div className="text-gray-400">→</div>
                            <div className="text-center">
                              <div className="text-2xl font-bold text-green-600">
                                {relatedCorrectiveAction.impactMetrics.pctBelow8After}%
                              </div>
                              <div className="text-xs text-gray-500">After</div>
                            </div>
                            <div className="text-center">
                              <div className="text-xl font-bold text-green-600">
                                -{relatedCorrectiveAction.impactMetrics.pctBelow8Before - relatedCorrectiveAction.impactMetrics.pctBelow8After}%
                              </div>
                              <div className="text-xs text-gray-500">Δ</div>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <h4 className="text-sm font-medium text-blue-900 mb-2">Notes</h4>
                        <p className="text-sm text-blue-800">{relatedCorrectiveAction.notes}</p>
                        <div className="text-xs text-blue-700 mt-2">
                          Based on {relatedCorrectiveAction.impactMetrics.toursBeforeAction} tours before and {relatedCorrectiveAction.impactMetrics.toursAfterAction} tours after implementation
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="flex gap-3 pt-4 border-t border-gray-200">
                    {action.status !== 'COMPLETED' && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowCompleteActionModal(true);
                          // Don't close selectedActionId - we need it for the form
                        }}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium"
                      >
                        Mark as Completed
                      </button>
                    )}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        alert('Edit functionality would open an edit form here');
                      }}
                      className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium"
                    >
                      Edit Action
                    </button>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {showCompleteActionModal && selectedActionId && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[60]">
          <div className="bg-white rounded-lg max-w-2xl w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Complete Action</h2>
              <button
                onClick={() => setShowCompleteActionModal(false)}
                className="text-gray-500 hover:text-gray-700 text-2xl leading-none"
              >
                ✕
              </button>
            </div>

            <form onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              const action = suggestedActions.find(a => a.id === selectedActionId);
              if (!action) return;

              const newCorrectiveAction: CorrectiveAction = {
                id: `ca-${Date.now()}`,
                suggestedActionId: action.id,
                destinationId: action.destinationId,
                itineraryId: action.itineraryId,
                issueTag: action.issueTag,
                actionTaken: formData.get('actionTaken') as string,
                implementedAt: formData.get('implementedAt') as string,
                owner: action.owner,
                notes: formData.get('notes') as string,
                impactMetrics: {
                  avgScoreBefore: parseFloat(formData.get('avgScoreBefore') as string),
                  avgScoreAfter: parseFloat(formData.get('avgScoreAfter') as string),
                  pctBelow8Before: parseFloat(formData.get('pctBelow8Before') as string),
                  pctBelow8After: parseFloat(formData.get('pctBelow8After') as string),
                  toursBeforeAction: parseInt(formData.get('toursBeforeAction') as string),
                  toursAfterAction: parseInt(formData.get('toursAfterAction') as string),
                },
              };

              setCompletedActionsState([newCorrectiveAction, ...completedActionsState]);
              setShowCompleteActionModal(false);
              setSelectedActionId(null);
              setCurrentPage('impact');
            }}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Action Taken *</label>
                  <textarea
                    name="actionTaken"
                    required
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Describe what was done to address the issue..."
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Implementation Date *</label>
                    <input
                      type="date"
                      name="implementedAt"
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Tours After Action *</label>
                    <input
                      type="number"
                      name="toursAfterAction"
                      required
                      min="1"
                      defaultValue="5"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <div className="border-t border-gray-200 pt-4">
                  <h3 className="text-sm font-semibold text-gray-900 mb-3">Impact Metrics</h3>

                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="bg-gray-50 rounded-lg p-3">
                      <label className="block text-xs font-medium text-gray-700 mb-2">Avg Score Before *</label>
                      <input
                        type="number"
                        name="avgScoreBefore"
                        required
                        step="0.1"
                        min="0"
                        max="10"
                        defaultValue="6.5"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div className="bg-green-50 rounded-lg p-3">
                      <label className="block text-xs font-medium text-green-700 mb-2">Avg Score After *</label>
                      <input
                        type="number"
                        name="avgScoreAfter"
                        required
                        step="0.1"
                        min="0"
                        max="10"
                        defaultValue="8.0"
                        className="w-full px-3 py-2 border border-green-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="bg-gray-50 rounded-lg p-3">
                      <label className="block text-xs font-medium text-gray-700 mb-2">% Below 8 Before *</label>
                      <input
                        type="number"
                        name="pctBelow8Before"
                        required
                        step="1"
                        min="0"
                        max="100"
                        defaultValue="60"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div className="bg-green-50 rounded-lg p-3">
                      <label className="block text-xs font-medium text-green-700 mb-2">% Below 8 After *</label>
                      <input
                        type="number"
                        name="pctBelow8After"
                        required
                        step="1"
                        min="0"
                        max="100"
                        defaultValue="25"
                        className="w-full px-3 py-2 border border-green-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-2">Tours Before Action *</label>
                    <input
                      type="number"
                      name="toursBeforeAction"
                      required
                      min="1"
                      defaultValue="8"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                  <textarea
                    name="notes"
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Additional notes about implementation or results..."
                  />
                </div>

                <div className="flex gap-3 pt-4 border-t border-gray-200">
                  <button
                    type="submit"
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium"
                  >
                    Complete & Track Impact
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowCompleteActionModal(false)}
                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {selectedResponseId && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">Full Response</h2>
              <button
                onClick={() => setSelectedResponseId(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            {/* Response detail would go here */}
          </div>
        </div>
      )}
    </div>
  );
};

export default App;