'use client';

/**
 * Party Detail Page
 * Shows party information with addresses and contacts tabs
 * Permission: TENANT_PARTY_VIEW, TENANT_PARTY_MANAGE
 */

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  User,
  Building2,
  Briefcase,
  Edit2,
  Trash2,
  Plus,
  MapPin,
  Phone,
  Mail,
  MoreVertical,
  Loader2,
  AlertCircle,
  Star,
  CheckCircle,
} from 'lucide-react';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu';
import { useAuthStore } from '@/lib/store/auth-store';
import {
  getPartyById,
  deleteParty,
  deletePartyAddress,
  deletePartyContact,
} from '@/lib/api/parties';
import {
  Party,
  PartyAddress,
  PartyContact,
  PartyType,
  PartyContactType,
  getPartyTypeLabel,
  getAddressTypeLabel,
  getContactTypeLabel,
  formatAddress,
} from '@/types/party';
import {
  PartyFormDialog,
  AddressFormDialog,
  ContactFormDialog,
} from '@/components/parties';

// ============================================
// Party Type Icon
// ============================================

function PartyTypeIcon({ type, className }: { type: PartyType; className?: string }) {
  switch (type) {
    case PartyType.Individual:
      return <User className={className} />;
    case PartyType.Company:
      return <Building2 className={className} />;
    case PartyType.Entity:
      return <Briefcase className={className} />;
    default:
      return <User className={className} />;
  }
}

// ============================================
// Address Card
// ============================================

interface AddressCardProps {
  address: PartyAddress;
  canManage: boolean;
  onEdit: () => void;
  onDelete: () => void;
}

function AddressCard({ address, canManage, onEdit, onDelete }: AddressCardProps) {
  return (
    <div className="flex items-start justify-between rounded-lg border border-gray-200 bg-white p-4">
      <div className="flex gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-100 text-primary-600">
          <MapPin className="h-5 w-5" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-900">
              {getAddressTypeLabel(address.addressType)}
            </span>
            {address.isPrimary && (
              <span className="inline-flex items-center gap-1 rounded-full bg-primary-100 px-2 py-0.5 text-xs font-medium text-primary-700">
                <Star className="h-3 w-3" />
                Primary
              </span>
            )}
          </div>
          <p className="mt-1 text-sm text-gray-600">{formatAddress(address)}</p>
        </div>
      </div>

      {canManage && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={onEdit}>Edit</DropdownMenuItem>
            <DropdownMenuItem className="text-error" onClick={onDelete}>
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  );
}

// ============================================
// Contact Card
// ============================================

interface ContactCardProps {
  contact: PartyContact;
  canManage: boolean;
  onEdit: () => void;
  onDelete: () => void;
}

function ContactCard({ contact, canManage, onEdit, onDelete }: ContactCardProps) {
  const getIcon = () => {
    switch (contact.contactType) {
      case PartyContactType.Email:
        return <Mail className="h-5 w-5" />;
      default:
        return <Phone className="h-5 w-5" />;
    }
  };

  return (
    <div className="flex items-start justify-between rounded-lg border border-gray-200 bg-white p-4">
      <div className="flex gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-100 text-primary-600">
          {getIcon()}
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-900">
              {getContactTypeLabel(contact.contactType)}
            </span>
            {contact.isPrimary && (
              <span className="inline-flex items-center gap-1 rounded-full bg-primary-100 px-2 py-0.5 text-xs font-medium text-primary-700">
                <Star className="h-3 w-3" />
                Primary
              </span>
            )}
            {contact.isVerified && (
              <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
                <CheckCircle className="h-3 w-3" />
                Verified
              </span>
            )}
          </div>
          <p className="mt-1 text-sm text-gray-600">{contact.value}</p>
        </div>
      </div>

      {canManage && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={onEdit}>Edit</DropdownMenuItem>
            <DropdownMenuItem className="text-error" onClick={onDelete}>
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  );
}

// ============================================
// Main Page Component
// ============================================

export default function PartyDetailPage() {
  const router = useRouter();
  const params = useParams();
  const tenantSlug = params.tenantSlug as string;
  const partyId = params.partyId as string;
  const { profile } = useAuthStore();

  // State
  const [party, setParty] = useState<Party | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Tab state - controlled to prevent reset on data refresh
  const [activeTab, setActiveTab] = useState('addresses');

  // Dialog states
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isAddAddressOpen, setIsAddAddressOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState<PartyAddress | null>(null);
  const [isAddContactOpen, setIsAddContactOpen] = useState(false);
  const [editingContact, setEditingContact] = useState<PartyContact | null>(null);

  // Permissions
  const permissions = profile?.permissions || {};
  const canManage = permissions['TENANT_PARTY_MANAGE'] === true;

  // Fetch party
  const fetchParty = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const data = await getPartyById(partyId);
      setParty(data);
    } catch (err) {
      console.error('Failed to fetch party:', err);
      setError('Party not found');
    } finally {
      setIsLoading(false);
    }
  }, [partyId]);

  useEffect(() => {
    fetchParty();
  }, [fetchParty]);

  // Handle delete party
  const handleDeleteParty = async () => {
    if (!party) return;
    if (!confirm(`Are you sure you want to delete "${party.partyName}"?`)) return;

    try {
      await deleteParty(party.id);
      router.push(`/tenant/${tenantSlug}/parties`);
    } catch (err) {
      console.error('Failed to delete party:', err);
      alert('Failed to delete party. It may be in use by other records.');
    }
  };

  // Handle delete address
  const handleDeleteAddress = async (address: PartyAddress) => {
    if (!confirm('Are you sure you want to delete this address?')) return;

    try {
      await deletePartyAddress(partyId, address.id);
      fetchParty();
    } catch (err) {
      console.error('Failed to delete address:', err);
      alert('Failed to delete address');
    }
  };

  // Handle delete contact
  const handleDeleteContact = async (contact: PartyContact) => {
    if (!confirm('Are you sure you want to delete this contact?')) return;

    try {
      await deletePartyContact(partyId, contact.id);
      fetchParty();
    } catch (err) {
      console.error('Failed to delete contact:', err);
      alert('Failed to delete contact');
    }
  };

  // Handle form success
  const handleFormSuccess = () => {
    setIsEditOpen(false);
    setIsAddAddressOpen(false);
    setEditingAddress(null);
    setIsAddContactOpen(false);
    setEditingContact(null);
    fetchParty();
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
        <p className="mt-3 text-gray-500">Loading party...</p>
      </div>
    );
  }

  // Error state
  if (error || !party) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <AlertCircle className="h-12 w-12 text-error" />
        <h2 className="mt-4 text-lg font-semibold text-gray-900">Party not found</h2>
        <p className="mt-1 text-sm text-gray-500">
          The party you&apos;re looking for doesn&apos;t exist or has been deleted.
        </p>
        <Link href={`/tenant/${tenantSlug}/parties`}>
          <Button variant="secondary" className="mt-4">
            <ArrowLeft className="h-4 w-4" />
            Back to Parties
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <Link href={`/tenant/${tenantSlug}/parties`}>
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary-100 text-primary-600">
              <PartyTypeIcon type={party.partyType} className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{party.partyName}</h1>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-sm text-gray-500">
                  {getPartyTypeLabel(party.partyType)}
                </span>
                <span
                  className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                    party.isActive
                      ? 'bg-green-100 text-green-700'
                      : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  {party.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {canManage && (
          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => setIsEditOpen(true)}>
              <Edit2 className="h-4 w-4" />
              Edit
            </Button>
            <Button variant="danger" onClick={handleDeleteParty}>
              <Trash2 className="h-4 w-4" />
              Delete
            </Button>
          </div>
        )}
      </div>

      {/* Party Info Card */}
      <Card>
        <CardHeader title="Party Information" />
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {party.legalName && (
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase">Legal Name</p>
                <p className="mt-1 text-sm text-gray-900">{party.legalName}</p>
              </div>
            )}
            {party.firstName && (
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase">First Name</p>
                <p className="mt-1 text-sm text-gray-900">{party.firstName}</p>
              </div>
            )}
            {party.lastName && (
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase">Last Name</p>
                <p className="mt-1 text-sm text-gray-900">{party.lastName}</p>
              </div>
            )}
            {party.dateOfBirth && (
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase">Date of Birth</p>
                <p className="mt-1 text-sm text-gray-900">{party.dateOfBirth}</p>
              </div>
            )}
            {party.registrationNumber && (
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase">Registration No.</p>
                <p className="mt-1 text-sm text-gray-900">{party.registrationNumber}</p>
              </div>
            )}
            {party.taxNumber && (
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase">Tax Number</p>
                <p className="mt-1 text-sm text-gray-900">{party.taxNumber}</p>
              </div>
            )}
            {party.notes && (
              <div className="sm:col-span-2 lg:col-span-3">
                <p className="text-xs font-medium text-gray-500 uppercase">Notes</p>
                <p className="mt-1 text-sm text-gray-900 whitespace-pre-wrap">{party.notes}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Addresses & Contacts Tabs */}
      <Tabs defaultValue="addresses" value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="addresses" icon={<MapPin className="h-4 w-4" />}>
            Addresses ({party.addresses?.length || 0})
          </TabsTrigger>
          <TabsTrigger value="contacts" icon={<Phone className="h-4 w-4" />}>
            Contacts ({party.contacts?.length || 0})
          </TabsTrigger>
        </TabsList>

        {/* Addresses Tab */}
        <TabsContent value="addresses">
          <Card>
            <CardHeader
              title="Addresses"
              description="Manage addresses for this party"
              action={
                canManage && (
                  <Button size="sm" onClick={() => setIsAddAddressOpen(true)}>
                    <Plus className="h-4 w-4" />
                    Add Address
                  </Button>
                )
              }
            />
            <CardContent>
              {party.addresses && party.addresses.length > 0 ? (
                <div className="space-y-3">
                  {party.addresses.map((address) => (
                    <AddressCard
                      key={address.id}
                      address={address}
                      canManage={canManage}
                      onEdit={() => setEditingAddress(address)}
                      onDelete={() => handleDeleteAddress(address)}
                    />
                  ))}
                </div>
              ) : (
                <div className="py-8 text-center">
                  <MapPin className="mx-auto h-8 w-8 text-gray-300" />
                  <p className="mt-2 text-sm text-gray-500">No addresses added yet</p>
                  {canManage && (
                    <Button
                      variant="secondary"
                      size="sm"
                      className="mt-3"
                      onClick={() => setIsAddAddressOpen(true)}
                    >
                      <Plus className="h-4 w-4" />
                      Add Address
                    </Button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Contacts Tab */}
        <TabsContent value="contacts">
          <Card>
            <CardHeader
              title="Contacts"
              description="Manage contact information for this party"
              action={
                canManage && (
                  <Button size="sm" onClick={() => setIsAddContactOpen(true)}>
                    <Plus className="h-4 w-4" />
                    Add Contact
                  </Button>
                )
              }
            />
            <CardContent>
              {party.contacts && party.contacts.length > 0 ? (
                <div className="space-y-3">
                  {party.contacts.map((contact) => (
                    <ContactCard
                      key={contact.id}
                      contact={contact}
                      canManage={canManage}
                      onEdit={() => setEditingContact(contact)}
                      onDelete={() => handleDeleteContact(contact)}
                    />
                  ))}
                </div>
              ) : (
                <div className="py-8 text-center">
                  <Phone className="mx-auto h-8 w-8 text-gray-300" />
                  <p className="mt-2 text-sm text-gray-500">No contacts added yet</p>
                  {canManage && (
                    <Button
                      variant="secondary"
                      size="sm"
                      className="mt-3"
                      onClick={() => setIsAddContactOpen(true)}
                    >
                      <Plus className="h-4 w-4" />
                      Add Contact
                    </Button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Dialogs */}
      <PartyFormDialog
        open={isEditOpen}
        onOpenChange={setIsEditOpen}
        party={party}
        onSuccess={handleFormSuccess}
      />

      <AddressFormDialog
        open={isAddAddressOpen || !!editingAddress}
        onOpenChange={(open) => {
          if (!open) {
            setIsAddAddressOpen(false);
            setEditingAddress(null);
          }
        }}
        partyId={partyId}
        address={editingAddress}
        onSuccess={handleFormSuccess}
      />

      <ContactFormDialog
        open={isAddContactOpen || !!editingContact}
        onOpenChange={(open) => {
          if (!open) {
            setIsAddContactOpen(false);
            setEditingContact(null);
          }
        }}
        partyId={partyId}
        contact={editingContact}
        onSuccess={handleFormSuccess}
      />
    </div>
  );
}

