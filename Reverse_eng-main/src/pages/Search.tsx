import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { TrainCard } from '@/components/TrainCard';
import { MOCK_TRAINS } from '@/utils/mockData';
import { Train } from '@/types/booking';
import { isAuthenticated, logout, getCurrentUser } from '@/utils/auth';
import { Search as SearchIcon, LogOut, User, Ticket } from 'lucide-react';

const Search = () => {
  const navigate = useNavigate();
  const [source, setSource] = useState('');
  const [destination, setDestination] = useState('');
  const [filteredTrains, setFilteredTrains] = useState<Train[]>([]);
  const [showResults, setShowResults] = useState(false);
  const user = getCurrentUser();

  useEffect(() => {
    if (!isAuthenticated()) {
      navigate('/auth');
    }
  }, [navigate]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!source || !destination) {
      return;
    }

    const results = MOCK_TRAINS.filter(train => 
      train.source.toLowerCase().includes(source.toLowerCase()) &&
      train.destination.toLowerCase().includes(destination.toLowerCase())
    );
    
    setFilteredTrains(results);
    setShowResults(true);
  };

  const handleBook = (train: Train) => {
    localStorage.setItem('selected_train', JSON.stringify(train));
    navigate('/booking');
  };

  const handleLogout = () => {
    logout();
    navigate('/auth');
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-gradient-to-r from-primary to-primary/90 text-primary-foreground shadow-lg">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Ticket className="w-8 h-8 text-secondary" />
              <h1 className="text-2xl font-bold">Captcha Free RailBook</h1>
            </div>
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                className="text-primary-foreground hover:bg-primary-foreground/10"
                onClick={() => navigate('/dashboard')}
              >
                <User className="w-4 h-4 mr-2" />
                {user?.username}
              </Button>
              <Button
                variant="ghost"
                className="text-primary-foreground hover:bg-primary-foreground/10"
                onClick={handleLogout}
              >
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Search Section */}
      <div className="bg-gradient-to-r from-primary to-primary/90 pb-16 pt-8">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-primary-foreground mb-8 text-center">
              Search Trains
            </h2>
            
            <form onSubmit={handleSearch} className="bg-card rounded-xl shadow-2xl p-6">
              <div className="grid md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="source">From</Label>
                  <Input
                    id="source"
                    placeholder="Enter source station"
                    value={source}
                    onChange={(e) => setSource(e.target.value)}
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="destination">To</Label>
                  <Input
                    id="destination"
                    placeholder="Enter destination station"
                    value={destination}
                    onChange={(e) => setDestination(e.target.value)}
                    required
                  />
                </div>

                <div className="flex items-end">
                  <Button type="submit" className="w-full" size="lg">
                    <SearchIcon className="w-4 h-4 mr-2" />
                    Search Trains
                  </Button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* Results Section */}
      <div className="container mx-auto px-4 py-8">
        {showResults ? (
          <div className="max-w-6xl mx-auto">
            <h3 className="text-2xl font-bold mb-6">
              Available Trains ({filteredTrains.length})
            </h3>
            
            {filteredTrains.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">No trains found for this route</p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredTrains.map(train => (
                  <TrainCard key={train.id} train={train} onBook={handleBook} />
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="max-w-4xl mx-auto text-center py-12">
            <h3 className="text-2xl font-semibold mb-4">Browse All Trains</h3>
            <div className="space-y-4">
              {MOCK_TRAINS.map(train => (
                <TrainCard key={train.id} train={train} onBook={handleBook} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Search;
