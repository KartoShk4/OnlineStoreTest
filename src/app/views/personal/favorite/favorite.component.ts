import {Component, OnInit} from '@angular/core';
import {FavoriteService} from "../../../shared/services/favorite.service";
import {FavoriteType} from "../../../../types/favorite.type";
import {DefaultResponseType} from "../../../../types/default-response.type";
import {environment} from "../../../../environments/environment";
import {CartService} from "../../../shared/services/cart.service";
import {AuthService} from "../../../core/auth/auth.service";
import {Router} from "@angular/router";
import {MatSnackBar} from "@angular/material/snack-bar";

@Component({
  selector: 'app-favorite',
  templateUrl: './favorite.component.html',
  styleUrls: ['./favorite.component.scss']
})
export class FavoriteComponent implements OnInit {

  products: FavoriteType[] = [];
  serverStaticPath: string = environment.serverStaticPath;
  cartProducts: { [id: string]: number } = {};

  constructor(private favoriteService: FavoriteService,
              private cartService: CartService,
              private authService: AuthService,
              private router: Router,
              private _snackBar: MatSnackBar) {
  }

  ngOnInit(): void {
    if (!this.authService.getIsLoggedIn()) {
      this.router.navigate(['/']);
      this._snackBar.open('Для доступа к избранному необходимо авторизоваться');
      return;
    }

    this.favoriteService.getFavorites()
      .subscribe((data: FavoriteType[] | DefaultResponseType): void => {
        if ((data as DefaultResponseType).error !== undefined) {
          const error: string = (data as DefaultResponseType).message;
          throw new Error(error);
        }
        this.products = data as FavoriteType[];
        this.loadCart();
      });
  }

  loadCart(): void {
    this.cartService.getCart()
      .subscribe((data: any) => {
        if ((data as DefaultResponseType).error !== undefined) {
          throw new Error((data as DefaultResponseType).message);
        }
        const cartData = data as any;
        this.cartProducts = {};
        cartData.items.forEach((item: any) => {
          this.cartProducts[item.product.id] = item.quantity;
        });
      });
  }

  removeFromFavorites(id: string): void {
    this.favoriteService.removeFavorites(id)
      .subscribe((data: DefaultResponseType): void => {
        if (data.error) {
          throw new Error(data.message);
        }
        this.products = this.products.filter(item => item.id !== id);
        delete this.cartProducts[id];
      });
  }

  addToCart(productId: string, count: number = 1): void {
    this.cartService.updateCart(productId, count)
      .subscribe((data: any) => {
        if ((data as DefaultResponseType).error !== undefined) {
          throw new Error((data as DefaultResponseType).message);
        }
        this.cartProducts[productId] = count;
      });
  }

  updateCount(productId: string, count: number): void {
    this.cartService.updateCart(productId, count)
      .subscribe((data: any) => {
        if ((data as DefaultResponseType).error !== undefined) {
          throw new Error((data as DefaultResponseType).message);
        }
        this.cartProducts[productId] = count;
      });
  }

  removeFromCart(productId: string): void {
    this.cartService.updateCart(productId, 0)
      .subscribe((data: any) => {
        if ((data as DefaultResponseType).error !== undefined) {
          throw new Error((data as DefaultResponseType).message);
        }
        delete this.cartProducts[productId];
      });
  }
}
