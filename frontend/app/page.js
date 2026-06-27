"use client";

import { useState, useEffect, useMemo} from "react";
import { fetchTimeline, fetchClusterDetail } from "../lib/api";
import Timeline from "../components/Timeline";
import ClusterDetail from "../components/ClusterDetail";
import SourceFilter from "../components/SourceFilter";  
import RefreshButton from "../components/RefreshButton";

export default function Home() {
  const [clusters, setClusters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [selectedClusterId, setSelectedClusterId] = useState(null);
  const [clusterDetail, setClusterDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const [activeSources, setActiveSources] = useState(null);
  // null = no filter applied so it will show everything 
  // its the set of sources the user wants to see.

  async function loadTimeline() {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchTimeline();
      setClusters(data);

      //initialize the filter to all sources on the first time data loads so the filter starts fully checked rather than empty
      if (activeSources == null){
        const allSources=new Set(data.flatMap((c)=>c.sources));
        setActiveSources(allSources);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadTimeline();
  }, []);
  
  //derive the full set of sources seen across all clusters not just
  //currently-visible ones so the filter ui doesnt lose checkboxes
  //as the user filters things out
  const allSources=useMemo(()=>{
    const set=new Set();
    clusters.forEach((c) => c.sources.forEach((s)=>set.add(s)));
    return Array.from(set).sort();
  },[clusters]);

  //a cluster is visible if at least one of its sources is currently active
  //a cluster with both BBC and NPR articles stays visible if either
  //is checked rather than requiring all its sources to be active
  const visibleClusters=useMemo(()=>{
    if(!activeSources) return clusters;
    return clusters.filter((c)=>c.sources.some((s)=>activeSources.has(s)));
  },[clusters,activeSources]);

  function toggleSource(source){
    setActiveSources((prev)=>{
      const next=new Set(prev);
      if(next.has(source)){
        next.delete(source);
      }else{
        next.add(source);
      }
      return next;
    });
  }

  async function handleClusterClick(clusterId) {
    setSelectedClusterId(clusterId);
    setDetailLoading(true);
    try {
      const detail = await fetchClusterDetail(clusterId);
      setClusterDetail(detail);
    } catch (err) {
      setError(err.message);
    } finally {
      setDetailLoading(false);
    }
  }

  if (loading) return <main className="p-8">Loading timeline...</main>;
  if (error) return <main className="p-8 text-red-600">Error: {error}</main>;

  return (
    <main className="site-container py-10">
      <header className="mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 items-start gap-4">
          <div className="pl-1 flex items-center gap-3">
            <div>
              <div className="text-lg font-semibold brand-title">News Pulse</div>
            </div>
          </div>

          <div className="text-center">
            <h1 className="text-4xl md:text-5xl hero-title">What is happening in the world</h1>
            <p className="mt-2 hero-sub">RSS articles from BBC, NPR and Al Jazeera, grouped by topic and plotted across time.</p>
          </div>

          <div className="flex justify-end items-center gap-4">
            <RefreshButton onComplete={loadTimeline} />
            <div className="text-sm text-gray-500">{clusters.length} clusters</div>
          </div>
        </div>

        <hr className="my-6 border-t border-gray-100" />
      </header>

      <div className="mb-6 flex justify-center">
        <div className="w-full md:w-3/4">
          <SourceFilter 
            allSources={allSources}
            activeSources={activeSources || new Set()}
            onToggle={toggleSource}
          />
        </div>
      </div>

      <section className="card-surface p-6">
        <Timeline clusters={visibleClusters} onClusterClick={handleClusterClick} />
      </section>

      {selectedClusterId && (
        <ClusterDetail
          detail={clusterDetail}
          loading={detailLoading}
          activeSources={activeSources || new Set()}
          onClose={() => {
            setSelectedClusterId(null);
            setClusterDetail(null);
          }}
        />
      )}
    </main>
  );
}