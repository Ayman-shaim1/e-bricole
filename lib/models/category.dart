class Category {
  final String id;
  final String name;
  final String image;

  const Category({required this.id, required this.name, required this.image});

  static const List<Category> categories = [
    Category(id: '1', name: 'Gardener', image: 'assets/icons/jardinier.png'),
    Category(id: '2', name: 'Cleaner', image: 'assets/icons/menage.png'),
    Category(id: '3', name: 'Plumber', image: 'assets/icons/plombier.png'),
    Category(
      id: '4',
      name: 'Electrician',
      image: 'assets/icons/electricien.png',
    ),
    Category(id: '5', name: 'Joiner', image: 'assets/icons/menuisier.png'),
  ];
}
