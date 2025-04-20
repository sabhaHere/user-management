import { Component, computed, effect, inject, signal } from '@angular/core';
import { UserService } from '../../services/user.service';
import { routes } from '../../app.routes';
import { Router } from '@angular/router';
import { User } from '../../models/user';
import { ViewUserDetailsComponent } from "../view-user-details/view-user-details.component";
import Notiflix from 'notiflix';
@Component({
  selector: 'app-user-list',
  imports: [ViewUserDetailsComponent],
  templateUrl: './user-list.component.html',
  styleUrl: './user-list.component.css',
})
export class UserListComponent {
  private userService = inject(UserService);
  private router = inject(Router);

  // signals for component state
  userList = signal<User[]>([]);
  editingUser = signal<User | null>(null);
  editedUser = signal<User | null>(null);
  headers = signal<string[]>([]); // to add the headers dynamically

  selectedUser = signal<User | null>(null); // for showing the details of selected user in the modal

  users = computed(() => this.userService.paginatedUsers());
  currentPage = computed(() => this.userService.Currentpage); // call the getter for getting the current page
  totalPages = computed(() => this.userService.totalPages());
  pageSize = computed(() => this.userService.PageSize); // call the getter
  tableColumns = signal<string[]>(['id', 'name']);

  // Available page sizes
  pageSizeOptions = [5, 10, 20, 50];

  constructor() {
    this.userList.set(this.userService.UsersList);
    if (this.userService.UsersList.length > 0) {
      this.headers.set(Object.keys(this.userService.UsersList[0])); // set the headers dynamically based on the structure of first user
    }

    effect(() => {
      const currentUser = this.users();
      if (currentUser.length > 0 && this.headers().length === 0) {
        this.headers.set(Object.keys(currentUser[0]));
        console.log(this.headers());
      }
      this.userList.set(this.userService.UsersList);
    });

    // Initialize Notiflix with custom settings
    Notiflix.Confirm.init({
      titleColor: '#1775ee',
      okButtonBackground: '#1775ee',
      cancelButtonBackground: '#a9a9a9',
      width: '320px',
      borderRadius: '8px',
      fontFamily: 'Arial, sans-serif',
      cssAnimationStyle: 'zoom',
    });

    Notiflix.Notify.init({
      position: 'right-top',
      width: '280px',
      distance: '10px',
      opacity: 1,
      borderRadius: '5px',
      fontFamily: 'Arial, sans-serif',
      cssAnimationStyle: 'fade',
      success: {
        background: '#32c682',
        textColor: '#fff',
      },
      failure: {
        background: '#ff5549',
        textColor: '#fff',
      },
      warning: {
        background: '#eebf31',
        textColor: '#fff',
      },
      info: {
        background: '#26c0d3',
        textColor: '#fff',
      },
    });
  }

  showUserDetails(user: User) {
    if (this.editingUser() != user) {
      this.selectedUser.set(user);
    }
  }

  closeUseModal() {
    this.selectedUser.set(null);
  }

  startEditing(user: User) {
    this.editingUser.set(user);
    this.editedUser.set({ ...user });
  }

  // Show confirmation dialog with Notiflix
  saveEditedUser() {
    const userToSave = this.editedUser();
    if (userToSave) {
      Notiflix.Confirm.show(
        'Save Changes',
        'Are you sure you want to save these changes?',
        'Save',
        'Cancel',
        () => {
          this.userService.updateUser(userToSave);
          this.editedUser.set(null);
          this.editingUser.set(null);
          Notiflix.Notify.success('User updated successfully!');
        },
        () => {
          Notiflix.Notify.info('Edit canceled');
        }
      );
    }
  }

  // Show confirmation dialog with Notiflix
  cancelEditing(): void {
    Notiflix.Confirm.show(
      'Cancel Editing',
      'Are you sure you want to cancel? Your changes will be lost.',
      'Cancel',
      'Continue Editing',
      () => {
        this.editingUser.set(null);
        this.editedUser.set(null);
        Notiflix.Notify.info('Editing canceled');
      },
      () => {}
    );
  }

  updateEditedUser(property: string, value: any) {
    const currentUser = this.editedUser();
    if (currentUser) {
      this.editedUser.update((user) => ({
        ...user!,
        [property]: property === 'version' ? parseFloat(value) : value,
      }));
    }
  }

  // Pagination methods
  nextPage(): void {
    this.userService.nextPage();
  }

  previousPage(): void {
    this.userService.previousPage();
  }

  goToPage(page: number): void {
    this.userService.setCurrentPages(page);
  }
  changePageSize(event: Event): void {
    const select = event.target as HTMLSelectElement;
    this.userService.setPageSize(Number(select.value));
  }

  // Generate page numbers for pagination
  getPageNumbers(): number[] {
    const total = this.totalPages();
    const current = this.currentPage();

    if (total <= 5) {
      return Array.from({ length: total }, (_, i) => i + 1);
    }

    if (current <= 3) {
      return [1, 2, 3, 4, 5];
    }

    if (current >= total - 2) {
      return [total - 4, total - 3, total - 2, total - 1, total];
    }

    return [current - 2, current - 1, current, current + 1, current + 2];
  }

  handleInputChange(event: Event, property: string): void {
    const target = event.target as HTMLInputElement | HTMLTextAreaElement;
    const value = target.value;
    this.updateEditedUser(property, value);
  }

  visibleHeaders = computed(() => {
    const allHeaders = this.headers();
    const orderedHeaders = ['id', 'name']; // Always ensure id and name come first in this specific order
    if (this.editingUser()) {
      return [
        ...orderedHeaders,
        ...allHeaders.filter((header) => !orderedHeaders.includes(header)),
      ];
    }

    return orderedHeaders.filter((header) => allHeaders.includes(header)); // For display mode, only show id and name in the specified order
  });

  getPropertyValue(user: User, propertyName: string): any {
    // Add cases for all other possible properties in your User model
    switch (propertyName) {
      case 'id':
        return user.id;
      case 'name':
        return user.name;
      case 'bio':
        return user.bio;
      case 'language':
        return user.language;
      case 'version':
        return user.version;

      default:
        return '';
    }
  }

  closeUserModal(): void {
    this.selectedUser.set(null);
  }

  deleteUser(id: string): void {
    Notiflix.Confirm.show(
      'Delete User',
      'Are you sure you want to delete this user?',
      'Delete',
      'Cancel',
      () => {
        this.userService.deleteUser(id);
        Notiflix.Notify.success('User deleted successfully!');
      },
      () => {
        Notiflix.Notify.info('Deletion canceled');
      }
    );
  }

  searchTerm = signal<string>('');

filteredUsers = computed(() => {
  const term = this.searchTerm().toLowerCase();
  return this.userService.paginatedUsers().filter(user =>
    user.name.toLowerCase().includes(term) ||
    user.language.toLowerCase().includes(term) ||
    user.bio.toLowerCase().includes(term)
  );
});
}
