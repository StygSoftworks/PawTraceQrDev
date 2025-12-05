import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAdminCheck } from "@/hooks/useAdminCheck";
import { getAllPetsAdmin, type AdminPetRow } from "@/lib/admin";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { QRCodeDialog } from "@/components/QRCodeDialog";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import {
  Search, Eye, QrCode, PawPrint, AlertCircle,
  ChevronDown, ChevronUp, Dog, Cat, Home, Trees, Mountain
} from "lucide-react";
import { format } from "date-fns";
import { getSubscriptionBadgeVariant } from "@/config/billing";
import type { PetRow } from "@/lib/pets";

export default function AdminPets() {
  const { isAdmin, isLoading: roleLoading } = useAdminCheck();
  const [searchQuery, setSearchQuery] = useState("");
  const [speciesFilter, setSpeciesFilter] = useState<string>("all");
  const [tagTypeFilter, setTagTypeFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const [qrTarget, setQrTarget] = useState<PetRow | null>(null);

  const { data: pets, isLoading, isError } = useQuery({
    queryKey: ["admin-all-pets"],
    queryFn: getAllPetsAdmin,
    enabled: isAdmin,
    staleTime: 30_000,
  });

  const filteredPets = useMemo(() => {
    if (!pets) return [];

    return pets.filter((pet) => {
      const matchesSearch =
        searchQuery === "" ||
        pet.pet_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        pet.owner_email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        pet.short_id.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesSpecies = speciesFilter === "all" || pet.species === speciesFilter;
      const matchesTagType = tagTypeFilter === "all" || pet.tag_type === tagTypeFilter;
      const matchesStatus = statusFilter === "all" ||
        (statusFilter === "missing" && pet.missing) ||
        (statusFilter === "not_missing" && !pet.missing);

      return matchesSearch && matchesSpecies && matchesTagType && matchesStatus;
    });
  }, [pets, searchQuery, speciesFilter, tagTypeFilter, statusFilter]);

  const stats = useMemo(() => {
    if (!pets) return { total: 0, dogs: 0, cats: 0, other: 0, missing: 0, active: 0 };

    return {
      total: pets.length,
      dogs: pets.filter((p) => p.species === "dog").length,
      cats: pets.filter((p) => p.species === "cat").length,
      other: pets.filter((p) => p.species === "other").length,
      missing: pets.filter((p) => p.missing).length,
      active: pets.filter((p) => p.subscription_status === "active").length,
    };
  }, [pets]);

  const viewPetPage = (pet: AdminPetRow) => {
    const baseUrl = window.location.origin;
    const petUrl = `${baseUrl}/p/${pet.short_id}`;
    window.open(petUrl, "_blank");
  };

  const openQRDialog = (pet: AdminPetRow) => {
    const petRow: PetRow = {
      id: pet.pet_id,
      owner_id: pet.owner_id,
      name: pet.pet_name,
      species: pet.species,
      breed: pet.breed,
      color: pet.color,
      weight: pet.weight,
      birthdate: pet.birthdate,
      microchip_id: pet.microchip_id,
      description: pet.description,
      notes: pet.notes,
      vaccinations: pet.vaccinations,
      photo_url: pet.photo_url,
      created_at: pet.created_at,
      updated_at: pet.updated_at,
      missing: pet.missing,
      missing_since: pet.missing_since,
      qr_url: pet.qr_url,
      short_id: pet.short_id,
      tag_type: pet.tag_type,
      environment: pet.environment,
      paypal_subscription_id: pet.paypal_subscription_id,
      subscription_status: pet.subscription_status,
      subscription_activated_at: pet.subscription_activated_at,
      subscription_expires_at: pet.subscription_expires_at,
      subscription_plan_id: pet.subscription_plan_id,
    };
    setQrTarget(petRow);
  };

  const toggleExpandRow = (petId: string) => {
    setExpandedRow(expandedRow === petId ? null : petId);
  };

  const getEnvironmentIcon = (env: string) => {
    switch (env) {
      case "indoor":
        return <Home className="h-3.5 w-3.5" />;
      case "outdoor":
        return <Trees className="h-3.5 w-3.5" />;
      case "indoor_outdoor":
        return <Mountain className="h-3.5 w-3.5" />;
      default:
        return null;
    }
  };

  if (roleLoading) {
    return (
      <div className="container mx-auto px-4 sm:px-6 py-10">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="container mx-auto px-4 sm:px-6 py-10">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3 text-muted-foreground">
              <AlertCircle className="h-5 w-5" />
              <p>You don't have permission to view this page. (Admins/Owners only)</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 sm:px-6 py-10 max-w-7xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight">All Pets</h1>
          <p className="text-muted-foreground mt-1">View and manage all pets across all users</p>
        </div>
        <PawPrint className="h-8 w-8 text-primary" />
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-6">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">Total Pets</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold flex items-center gap-2">
              <Dog className="h-5 w-5" />
              {stats.dogs}
            </div>
            <p className="text-xs text-muted-foreground">Dogs</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold flex items-center gap-2">
              <Cat className="h-5 w-5" />
              {stats.cats}
            </div>
            <p className="text-xs text-muted-foreground">Cats</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{stats.other}</div>
            <p className="text-xs text-muted-foreground">Other</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-destructive">{stats.missing}</div>
            <p className="text-xs text-muted-foreground">Missing</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-green-600">{stats.active}</div>
            <p className="text-xs text-muted-foreground">Active Subs</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-lg">Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, email, or ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={speciesFilter} onValueChange={setSpeciesFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All Species" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Species</SelectItem>
                <SelectItem value="dog">Dogs</SelectItem>
                <SelectItem value="cat">Cats</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
            <Select value={tagTypeFilter} onValueChange={setTagTypeFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All Tag Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Tag Types</SelectItem>
                <SelectItem value="dog">Dog Tags</SelectItem>
                <SelectItem value="cat">Cat Tags</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="missing">Missing Only</SelectItem>
                <SelectItem value="not_missing">Not Missing</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Pets Table */}
      <Card>
        <CardHeader>
          <CardTitle>Pets ({filteredPets.length})</CardTitle>
          <CardDescription>
            {searchQuery || speciesFilter !== "all" || tagTypeFilter !== "all" || statusFilter !== "all"
              ? `Showing ${filteredPets.length} of ${pets?.length ?? 0} pets`
              : `Total of ${pets?.length ?? 0} pets`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-muted-foreground">Loading pets...</p>
          ) : isError ? (
            <p className="text-destructive">Error loading pets</p>
          ) : filteredPets.length === 0 ? (
            <p className="text-muted-foreground">No pets found</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[50px]"></TableHead>
                    <TableHead>Pet</TableHead>
                    <TableHead>Owner</TableHead>
                    <TableHead>Species</TableHead>
                    <TableHead>Tag Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPets.map((pet) => (
                    <>
                      <TableRow key={pet.pet_id} className="group">
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => toggleExpandRow(pet.pet_id)}
                            className="h-8 w-8"
                          >
                            {expandedRow === pet.pet_id ? (
                              <ChevronUp className="h-4 w-4" />
                            ) : (
                              <ChevronDown className="h-4 w-4" />
                            )}
                          </Button>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar className="h-10 w-10">
                              {pet.photo_url ? (
                                <AvatarImage src={pet.photo_url} alt={pet.pet_name} />
                              ) : (
                                <AvatarFallback>
                                  <PawPrint className="h-5 w-5" />
                                </AvatarFallback>
                              )}
                            </Avatar>
                            <div>
                              <div className="font-medium">{pet.pet_name}</div>
                              <div className="text-xs text-muted-foreground font-mono">{pet.short_id}</div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="text-sm">{pet.owner_email ?? "Unknown"}</div>
                            {pet.owner_name && (
                              <div className="text-xs text-muted-foreground">{pet.owner_name}</div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="capitalize">
                            {pet.species}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={pet.tag_type === "dog" ? "default" : "secondary"}>
                            {pet.tag_type === "dog" ? "Dog Size" : "Cat Size"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col gap-1">
                            {pet.missing && (
                              <Badge variant="destructive" className="w-fit">
                                Missing
                              </Badge>
                            )}
                            <Badge variant={getSubscriptionBadgeVariant(pet.subscription_status)} className="w-fit capitalize">
                              {pet.subscription_status}
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">{format(new Date(pet.created_at), "MMM d, yyyy")}</div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => viewPetPage(pet)}
                              title="View public page"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => openQRDialog(pet)}
                              title="View QR code"
                            >
                              <QrCode className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                      {expandedRow === pet.pet_id && (
                        <TableRow>
                          <TableCell colSpan={8} className="bg-muted/50">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4 px-2">
                              <div>
                                <h4 className="font-semibold mb-2">Pet Details</h4>
                                <dl className="space-y-1 text-sm">
                                  {pet.breed && (
                                    <>
                                      <dt className="text-muted-foreground inline">Breed: </dt>
                                      <dd className="inline">{pet.breed}</dd>
                                      <br />
                                    </>
                                  )}
                                  {pet.color && (
                                    <>
                                      <dt className="text-muted-foreground inline">Color: </dt>
                                      <dd className="inline">{pet.color}</dd>
                                      <br />
                                    </>
                                  )}
                                  {pet.weight && (
                                    <>
                                      <dt className="text-muted-foreground inline">Weight: </dt>
                                      <dd className="inline">{pet.weight} lbs</dd>
                                      <br />
                                    </>
                                  )}
                                  {pet.birthdate && (
                                    <>
                                      <dt className="text-muted-foreground inline">Birthdate: </dt>
                                      <dd className="inline">{format(new Date(pet.birthdate), "MMM d, yyyy")}</dd>
                                      <br />
                                    </>
                                  )}
                                  {pet.microchip_id && (
                                    <>
                                      <dt className="text-muted-foreground inline">Microchip: </dt>
                                      <dd className="inline font-mono">{pet.microchip_id}</dd>
                                      <br />
                                    </>
                                  )}
                                  <dt className="text-muted-foreground inline">Environment: </dt>
                                  <dd className="inline flex items-center gap-1">
                                    {getEnvironmentIcon(pet.environment)}
                                    <span className="capitalize">{pet.environment.replace("_", " ")}</span>
                                  </dd>
                                </dl>
                              </div>
                              <div>
                                <h4 className="font-semibold mb-2">Additional Info</h4>
                                <dl className="space-y-1 text-sm">
                                  {pet.description && (
                                    <>
                                      <dt className="text-muted-foreground">Description:</dt>
                                      <dd className="mb-2">{pet.description}</dd>
                                    </>
                                  )}
                                  {pet.notes && (
                                    <>
                                      <dt className="text-muted-foreground">Notes:</dt>
                                      <dd className="mb-2">{pet.notes}</dd>
                                    </>
                                  )}
                                  {pet.vaccinations?.rabies && (
                                    <>
                                      <dt className="text-muted-foreground inline">Rabies Vaccination: </dt>
                                      <dd className="inline">
                                        Yes
                                        {pet.vaccinations.rabiesExpires &&
                                          ` (expires ${format(new Date(pet.vaccinations.rabiesExpires), "MMM d, yyyy")})`}
                                      </dd>
                                    </>
                                  )}
                                </dl>
                              </div>
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* QR Code Dialog */}
      {qrTarget && (
        <QRCodeDialog
          pet={qrTarget}
          open={!!qrTarget}
          onOpenChange={(open) => !open && setQrTarget(null)}
          ownerId={qrTarget.owner_id}
        />
      )}
    </div>
  );
}
