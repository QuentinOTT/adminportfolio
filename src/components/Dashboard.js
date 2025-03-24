import React, { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import {
  Box,
  Container,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  AppBar,
  Toolbar,
  Button,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Grid,
  Card,
  CardContent,
  CardHeader,
  CardActions,
  Avatar,
  useTheme,
  useMediaQuery,
  TextField,
  Tooltip,
  CircularProgress,
  DialogContentText,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import LogoutIcon from '@mui/icons-material/Logout';
import MailIcon from '@mui/icons-material/Mail';
import PhoneIcon from '@mui/icons-material/Phone';
import SubjectIcon from '@mui/icons-material/Subject';
import BusinessIcon from '@mui/icons-material/Business';
import ArchiveIcon from '@mui/icons-material/Archive';
import MarkEmailReadIcon from '@mui/icons-material/MarkEmailRead';
import EmailIcon from '@mui/icons-material/Email';
import ReplyIcon from '@mui/icons-material/Reply';
import RefreshIcon from '@mui/icons-material/Refresh';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';

export default function Dashboard({ session }) {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredMessages, setFilteredMessages] = useState([]);
  const [replyDialogOpen, setReplyDialogOpen] = useState(false);
  const [replyMessage, setReplyMessage] = useState(null);
  const [replyContent, setReplyContent] = useState('');
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const navigate = useNavigate();

  const fetchMessages = async () => {
    try {
      const { data, error } = await supabase
        .from('contact_messages')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setMessages(data || []);
      setFilteredMessages(data || []);
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMessages();

    const subscription = supabase
      .channel('contact_messages')
      .on('*', () => {
        fetchMessages();
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const handleStatusChange = async (messageId, newStatus) => {
    try {
      const { error } = await supabase
        .from('contact_messages')
        .update({ status: newStatus })
        .eq('id', messageId);

      if (error) throw error;
      fetchMessages();
    } catch (error) {
      console.error('Error updating status:', error);
      // Afficher une notification d'erreur
    }
  };

  const handleDeleteClick = (message) => {
    setSelectedMessage(message);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!selectedMessage) return;

    try {
      const { error } = await supabase
        .from('contact_messages')
        .delete()
        .eq('id', selectedMessage.id);

      if (error) throw error;
      setDeleteDialogOpen(false);
      fetchMessages();
    } catch (error) {
      console.error('Error deleting message:', error);
    }
  };

  const handleSignOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const handleSearch = (event) => {
    const term = event.target.value.toLowerCase();
    setSearchTerm(term);
    const filtered = messages.filter(message =>
      message.name.toLowerCase().includes(term) ||
      message.email.toLowerCase().includes(term) ||
      message.subject.toLowerCase().includes(term) ||
      message.message.toLowerCase().includes(term)
    );
    setFilteredMessages(filtered);
  };

  const getStatusColor = (status) => {
    const colors = {
      new: '#2196F3',
      read: '#4CAF50',
      replied: '#00C853',
      archived: '#616161'
    };
    return colors[status] || '#616161';
  };

  const getStatusIcon = (status) => {
    const icons = {
      new: <MailIcon sx={{ mr: 0.5 }} />,
      read: <MarkEmailReadIcon sx={{ mr: 0.5 }} />,
      replied: <BusinessIcon sx={{ mr: 0.5 }} />,
      archived: <ArchiveIcon sx={{ mr: 0.5 }} />
    };
    return icons[status] || <MailIcon sx={{ mr: 0.5 }} />;
  };

  const formatDate = (date) => {
    return format(new Date(date), "d MMMM yyyy 'à' HH:mm", { locale: fr });
  };

  const handleReplyClick = (message) => {
    setReplyMessage(message);
    setReplyDialogOpen(true);
    setReplyContent(`Bonjour ${message.name},\n\n${message.message}\n\nCordialement,\nQuentin OTT`);
  };

  const handleReplySend = async () => {
    if (!replyMessage || !replyContent.trim()) return;

    try {
      // Ici vous pouvez ajouter la logique d'envoi d'email
      // Par exemple, utiliser un service d'envoi d'email comme SendGrid
      toast.success('Réponse envoyée avec succès');
      setReplyDialogOpen(false);
      setReplyContent('');
      await handleStatusChange(replyMessage.id, 'replied');
    } catch (error) {
      console.error('Error sending reply:', error);
      toast.error('Erreur lors de l\'envoi de la réponse');
    }
  };

  const handleRefresh = () => {
    setLoading(true);
    fetchMessages();
    toast.info('Messages mis à jour');
  };

  return (
    <Box sx={{ flexGrow: 1, bgcolor: 'background.default' }}>
      <AppBar position="static" color="primary" elevation={0}>
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1, fontWeight: 'bold' }}>
            Tableau de bord
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
            <TextField
              size="small"
              placeholder="Rechercher..."
              value={searchTerm}
              onChange={handleSearch}
              sx={{ minWidth: 200, bgcolor: 'background.paper' }}
            />
            <Button 
              color="inherit" 
              onClick={handleSignOut} 
              startIcon={<LogoutIcon />}
              sx={{ textTransform: 'none' }}
            >
              Déconnexion
            </Button>
          </Box>
        </Toolbar>
      </AppBar>

      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Card sx={{ height: '100%' }}>
              <CardHeader
                title="Messages de contact"
                titleTypographyProps={{ variant: 'h6', fontWeight: 'bold' }}
                action={
                  <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                    <Tooltip title="Rafraîchir">
                      <IconButton onClick={handleRefresh} color="primary">
                        <RefreshIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Marquer tous comme lus">
                      <IconButton onClick={() => handleStatusChange('all', 'read')}>
                        <MarkEmailReadIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Archiver tous">
                      <IconButton onClick={() => handleStatusChange('all', 'archived')}>
                        <ArchiveIcon />
                      </IconButton>
                    </Tooltip>
                  </Box>
                }
              />
              
              <CardContent>
                {loading ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                    <CircularProgress />
                  </Box>
                ) : (
                  <TableContainer component={Paper}>
                    <Table>
                      <TableHead>
                        <TableRow>
                          <TableCell sx={{ fontWeight: 'bold' }}>Statut</TableCell>
                          <TableCell sx={{ fontWeight: 'bold' }}>Nom</TableCell>
                          <TableCell sx={{ fontWeight: 'bold' }}>Email</TableCell>
                          <TableCell sx={{ fontWeight: 'bold' }}>Sujet</TableCell>
                          <TableCell sx={{ fontWeight: 'bold' }}>Date</TableCell>
                          <TableCell sx={{ fontWeight: 'bold' }}>Actions</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {filteredMessages.map((message) => (
                          <TableRow key={message.id}>
                            <TableCell>
                              <Chip
                                icon={getStatusIcon(message.status)}
                                label={message.status}
                                sx={{
                                  bgcolor: getStatusColor(message.status),
                                  color: 'white',
                                  borderRadius: '12px',
                                  '& .MuiChip-icon': {
                                    color: 'white'
                                  }
                                }}
                              />
                            </TableCell>
                            <TableCell>{message.name}</TableCell>
                            <TableCell>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <EmailIcon sx={{ color: 'primary.main' }} />
                                <Typography variant="body2" color="primary">
                                  {message.email}
                                </Typography>
                              </Box>
                            </TableCell>
                            <TableCell>{message.subject}</TableCell>
                            <TableCell>{formatDate(message.created_at)}</TableCell>
                            <TableCell>
                              <Box sx={{ display: 'flex', gap: 1 }}>
                                <Tooltip title="Répondre">
                                  <IconButton onClick={() => handleReplyClick(message)}>
                                    <ReplyIcon color="primary" />
                                  </IconButton>
                                </Tooltip>
                                <Tooltip title="Marquer comme lu">
                                  <IconButton onClick={() => handleStatusChange(message.id, 'read')}>
                                    <MarkEmailReadIcon color={message.status === 'read' ? 'primary' : 'action'} />
                                  </IconButton>
                                </Tooltip>
                                <Tooltip title="Archiver">
                                  <IconButton onClick={() => handleStatusChange(message.id, 'archived')}>
                                    <ArchiveIcon color={message.status === 'archived' ? 'primary' : 'action'} />
                                  </IconButton>
                                </Tooltip>
                                <Tooltip title="Supprimer">
                                  <IconButton onClick={() => handleDeleteClick(message)} color="error">
                                    <DeleteIcon />
                                  </IconButton>
                                </Tooltip>
                              </Box>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Container>

      <Dialog open={replyDialogOpen} onClose={() => setReplyDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Répondre à {replyMessage?.name}</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            multiline
            rows={4}
            value={replyContent}
            onChange={(e) => setReplyContent(e.target.value)}
            placeholder="Votre réponse..."
            sx={{ mt: 2 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setReplyDialogOpen(false)}>Annuler</Button>
          <Button onClick={handleReplySend} variant="contained" color="primary">
            Envoyer
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
      >
        <DialogTitle id="alert-dialog-title">
          Supprimer le message
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="alert-dialog-description">
            Êtes-vous sûr de vouloir supprimer ce message ? Cette action est irréversible.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Annuler</Button>
          <Button onClick={handleDeleteConfirm} variant="contained" color="error">
            Supprimer
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
